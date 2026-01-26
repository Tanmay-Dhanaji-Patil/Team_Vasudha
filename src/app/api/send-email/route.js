import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { supabaseAdmin } from '@/database/supabaseAdmin';
import { translations } from '@/utils/translations';
import path from 'path';

// Register Hindi Font - Using local TTF files for maximum reliability
const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Hind',
  fonts: [
    {
      src: path.join(fontsDir, 'Hind-Regular.ttf'),
      fontWeight: 400
    },
    {
      src: path.join(fontsDir, 'Hind-Bold.ttf'),
      fontWeight: 700
    }
  ]
});

Font.register({
  family: 'HindVadodara',
  fonts: [
    {
      src: path.join(fontsDir, 'HindVadodara-Regular.ttf'),
      fontWeight: 400
    },
    {
      src: path.join(fontsDir, 'HindVadodara-Bold.ttf'),
      fontWeight: 700
    }
  ]
});

Font.register({
  family: 'NotoTelugu',
  fonts: [
    { src: path.join(fontsDir, 'NotoSansTelugu-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'NotoSansTelugu-Bold.ttf'), fontWeight: 700 }
  ]
});

Font.register({
  family: 'NotoTamil',
  fonts: [
    { src: path.join(fontsDir, 'NotoSansTamil-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'NotoSansTamil-Bold.ttf'), fontWeight: 700 }
  ]
});

Font.register({
  family: 'NotoKannada',
  fonts: [
    { src: path.join(fontsDir, 'NotoSansKannada-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'NotoSansKannada-Bold.ttf'), fontWeight: 700 }
  ]
});

Font.register({
  family: 'NotoBengali',
  fonts: [
    { src: path.join(fontsDir, 'NotoSansBengali-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'NotoSansBengali-Bold.ttf'), fontWeight: 700 }
  ]
});

const interpolate = (str, params) => {
  let res = str;
  if (!params) return res;
  for (const key in params) {
    res = res.replace(new RegExp(`{${key}}`, 'g'), params[key]);
  }
  return res;
};

const BUCKET = 'soil-reports';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { samples, cropGroups, totalCost, fertilizerType, organicFertilizers, inorganicFertilizers, reportData, language = 'en' } = await request.json();

    const t = translations[language] || translations.en;

    // Create transporter with environment variables
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Validate email configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { success: false, message: 'Email configuration is missing. Please check environment variables.' },
        { status: 500 }
      );
    }    // Get unique emails from samples
    const uniqueEmails = [...new Set(samples.map(sample => sample.email))];

    // Generate PDF from data
    const pdfBuffer = await generatePDF(samples, cropGroups, totalCost, fertilizerType, organicFertilizers, inorganicFertilizers, reportData, language);

    // Upload per farmer with metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const uploads = [];

    for (const email of uniqueEmails) {
      // Fetch farmer by email from "Farmer Data"
      const { data: farmer, error: farmerError } = await supabaseAdmin
        .from('Farmer Data')
        .select('id, Farmer_name, Farmer_email')
        .eq('Farmer_email', email)
        .maybeSingle();

      if (farmerError) {
        // continue with unknown metadata if lookup fails
      }

      const farmerId = farmer?.id ?? 'unknown';
      const farmerName = farmer?.Farmer_name ?? 'unknown';

      const reportFileName = `Soil_Analysis_Report_${timestamp}.pdf`;
      const reportPath = `reports/${farmerId}/${reportFileName}`;

      let uploadErrMsg = null;
      let signedUrl = null;
      try {
        const { error: uploadError } = await supabaseAdmin
          .storage
          .from(BUCKET)
          .upload(reportPath, fileBlob, {
            contentType: 'application/pdf',
            upsert: true,
            metadata: {
              farmer_id: String(farmerId),
              farmer_name: String(farmerName),
              farmer_email: String(email)
            }
          });
        if (uploadError) {
          uploadErrMsg = `Upload failed: ${uploadError.message}`;
        } else {
          const { data: signedUrlData, error: signedError } = await supabaseAdmin
            .storage
            .from(BUCKET)
            .createSignedUrl(reportPath, 60 * 60);
          if (!signedError) {
            signedUrl = signedUrlData?.signedUrl || null;
          }
        }
      } catch (e) {
        uploadErrMsg = e?.message || 'Unknown upload error';
      }

      uploads.push({ email, farmer_id: farmerId, farmer_name: farmerName, storagePath: reportPath, signedUrl, uploadError: uploadErrMsg });
    }

    // Create a simple email text version
    const emailText = generateEmailText(samples, uniqueEmails.length, language);

    // Send email to each unique email address with PDF attachment
    const emailPromises = uniqueEmails.map(async (email) => {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: t.emailSubject,
        html: emailText,
        attachments: [
          {
            filename: `Soil_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      try {
        await transporter.sendMail(mailOptions);
        return { email, sent: true };
      } catch (e) {
        return { email, sent: false, error: e?.message || 'Email send error' };
      }
    });

    const emailResults = await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Processed ${uniqueEmails.length} recipient(s)`,
      emails: uniqueEmails,
      uploads,
      emailResults
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email: ' + error.message },
      { status: 500 }
    );
  }
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10
  },
  header: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    padding: 25,
    textAlign: 'center',
    marginBottom: 20,
    borderRadius: 8
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4f46e5',
    paddingBottom: 4,
    textAlign: 'left'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    gap: 10
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    textAlign: 'center',
    width: '23%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 4,
    textAlign: 'center'
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.2
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 8
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableColHeader: {
    width: '12.5%',
    backgroundColor: '#4f46e5',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableCol: {
    width: '12.5%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableCellHeader: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'center',
    color: '#374151'
  },
  recommendation: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
    paddingHorizontal: 5
  },
  bullet: {
    width: 12,
    fontSize: 8,
    color: '#10b981',
    marginRight: 5
  },
  recommendationText: {
    fontSize: 9,
    flex: 1,
    color: '#374151',
    lineHeight: 1.3,
    textAlign: 'left'
  },
  totalRow: {
    backgroundColor: '#10b981',
    borderBottomWidth: 0
  },
  totalCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  footer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1f2937',
    textAlign: 'center',
    borderRadius: 6
  },
  footerText: {
    color: '#ffffff',
    fontSize: 9,
    marginBottom: 3,
    textAlign: 'center'
  },
  footerTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  cropsList: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    color: '#4a5568',
    fontWeight: '500'
  }
});

// Generate PDF using React-PDF
async function generatePDF(samples, cropGroups, totalCost, fertilizerType, organicFertilizers, inorganicFertilizers, reportData, language = 'en') {
  try {
    const t = translations[language] || translations.en;

    let fontFamily = 'Helvetica';
    if (language === 'hi' || language === 'mr') {
      fontFamily = 'Hind';
    } else if (language === 'gu') {
      fontFamily = 'HindVadodara';
    } else if (language === 'te') {
      fontFamily = 'NotoTelugu';
    } else if (language === 'ta') {
      fontFamily = 'NotoTamil';
    } else if (language === 'kn') {
      fontFamily = 'NotoKannada';
    } else if (language === 'bn') {
      fontFamily = 'NotoBengali';
    }

    const fontStyle = { fontFamily };
    const interpolate = (text, params) => {
      let result = text;
      for (const key in params) {
        result = result.replace(`{${key}}`, params[key]);
      }
      return result;
    };

    // Group samples by crop for the report
    const groupedSamples = {};
    samples.forEach(sample => {
      if (!groupedSamples[sample.crop]) {
        groupedSamples[sample.crop] = [];
      }
      groupedSamples[sample.crop].push(sample);
    });

    // Calculate fertilizer requirements
    const cropOptions = [
      { name: "Wheat", values: { nitrogen: 90, phosphorous: 45, potassium: 45, temperature: 25, moisture: 15, ph: 7.0 } },
      { name: "Rice", values: { nitrogen: 110, phosphorous: 50, potassium: 60, temperature: 28, moisture: 20, ph: 6.5 } },
      { name: "Maize", values: { nitrogen: 80, phosphorous: 40, potassium: 50, temperature: 24, moisture: 12, ph: 6.8 } },
    ];

    const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;
    const prices = { nitrogen: 7, phosphorous: 8, potassium: 19 };

    let totalNitrogen = 0, totalPhosphorous = 0, totalPotassium = 0, grandTotalCost = 0;
    const fertilizerData = [];

    Object.entries(groupedSamples).forEach(([cropName, cropSamples]) => {
      const std = getStandardValues(cropName);
      let cropNitrogen = 0, cropPhosphorous = 0, cropPotassium = 0;

      cropSamples.forEach(sample => {
        cropNitrogen += Math.max(0, std.nitrogen - sample.nitrogen);
        cropPhosphorous += Math.max(0, std.phosphorous - sample.phosphorous);
        cropPotassium += Math.max(0, std.potassium - sample.potassium);
      });

      const cropCost = cropNitrogen * prices.nitrogen + cropPhosphorous * prices.phosphorous + cropPotassium * prices.potassium;
      totalNitrogen += cropNitrogen;
      totalPhosphorous += cropPhosphorous;
      totalPotassium += cropPotassium;
      grandTotalCost += cropCost;

      fertilizerData.push({
        crop: cropName,
        nitrogen: cropNitrogen.toFixed(2),
        phosphorous: cropPhosphorous.toFixed(2),
        potassium: cropPotassium.toFixed(2),
        cost: cropCost.toFixed(2)
      });
    });

    const currentDate = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create PDF Document
    const MyDocument = () => (
      <Document>
        <Page size="A4" style={{ ...styles.page, ...fontStyle }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
            <Text style={styles.subtitle}>{t.generatedOn}: {currentDate}</Text>
          </View>

          {/* Executive Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.executiveSummary}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{samples.length}</Text>
                <Text style={styles.statLabel}>{t.samplesAnalyzed}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{Object.keys(groupedSamples).length}</Text>
                <Text style={styles.statLabel}>{t.cropTypes}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{grandTotalCost.toFixed(0)}</Text>
                <Text style={styles.statLabel}>{t.totalInvestment}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{(totalNitrogen + totalPhosphorous + totalPotassium).toFixed(1)}</Text>
                <Text style={styles.statLabel}>{t.totalFertilizer}{'\n'}(kg)</Text>
              </View>
            </View>
            <Text style={styles.cropsList}>
              {t.cropsAnalyzed}: {Object.keys(groupedSamples).map(c => t.crops[c] || c).join(' • ')}
            </Text>
          </View>

          {/* Sample Analysis Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.sampleAnalysisDetails}</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.sampleId}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.crop}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.nitrogen}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.phosphorous}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.potassium}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.temperature}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.moisture}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>{t.ph}</Text>
                </View>
              </View>

              {/* Table Rows */}
              {samples.map((sample, index) => (
                <View style={styles.tableRow} key={index}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.day}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{t.crops[sample.crop] || sample.crop}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.nitrogen}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.phosphorous}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.potassium}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.temperature}°C</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.moisture}%</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{sample.ph}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Page>

        <Page size="A4" style={{ ...styles.page, ...fontStyle }}>
          {/* Investment Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.investmentAnalysis}</Text>
            <Text style={{ fontSize: 10, marginBottom: 12, color: '#4a5568', textAlign: 'left' }}>
              {t.investmentSubtitle}
            </Text>

            <View style={styles.table}>
              {/* Fertilizer Table Header */}
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, { width: '25%' }]}>
                  <Text style={styles.tableCellHeader}>{t.cropTypes}</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '18%' }]}>
                  <Text style={styles.tableCellHeader}>{t.nitrogen}{'\n'}(kg)</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '18%' }]}>
                  <Text style={styles.tableCellHeader}>{t.phosphorous}{'\n'}(kg)</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '18%' }]}>
                  <Text style={styles.tableCellHeader}>{t.potassium}{'\n'}(kg)</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '21%' }]}>
                  <Text style={styles.tableCellHeader}>{t.investmentCost}{'\n'}(Rs)</Text>
                </View>
              </View>

              {/* Fertilizer Data Rows */}
              {fertilizerData.map((row, index) => (
                <View style={styles.tableRow} key={index}>
                  <View style={[styles.tableCol, { width: '25%' }]}>
                    <Text style={styles.tableCell}>{t.crops[row.crop] || row.crop}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '18%' }]}>
                    <Text style={styles.tableCell}>{row.nitrogen}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '18%' }]}>
                    <Text style={styles.tableCell}>{row.phosphorous}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '18%' }]}>
                    <Text style={styles.tableCell}>{row.potassium}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '21%' }]}>
                    <Text style={styles.tableCell}>Rs {row.cost}</Text>
                  </View>
                </View>
              ))}

              {/* Total Row */}
              <View style={[styles.tableRow, styles.totalRow]}>
                <View style={[styles.tableCol, { width: '25%', backgroundColor: '#10b981' }]}>
                  <Text style={styles.totalCell}>{t.total}</Text>
                </View>
                <View style={[styles.tableCol, { width: '18%', backgroundColor: '#10b981' }]}>
                  <Text style={styles.totalCell}>{totalNitrogen.toFixed(2)}</Text>
                </View>
                <View style={[styles.tableCol, { width: '18%', backgroundColor: '#10b981' }]}>
                  <Text style={styles.totalCell}>{totalPhosphorous.toFixed(2)}</Text>
                </View>
                <View style={[styles.tableCol, { width: '18%', backgroundColor: '#10b981' }]}>
                  <Text style={styles.totalCell}>{totalPotassium.toFixed(2)}</Text>
                </View>
                <View style={[styles.tableCol, { width: '21%', backgroundColor: '#10b981' }]}>
                  <Text style={styles.totalCell}>Rs {grandTotalCost.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Expert Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.expertRecommendations}</Text>
            <View style={styles.recommendation}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.recommendationText}>
                <Text style={{ fontWeight: 'bold' }}>{t.nitrogenManagement}:</Text> {interpolate(t.nitrogenMsg, { amount: totalNitrogen.toFixed(2) })}
              </Text>
            </View>
            <View style={styles.recommendation}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.recommendationText}>
                <Text style={{ fontWeight: 'bold' }}>{t.phosphorousEnhancement}:</Text> {interpolate(t.phosphorousMsg, { amount: totalPhosphorous.toFixed(2) })}
              </Text>
            </View>
            <View style={styles.recommendation}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.recommendationText}>
                <Text style={{ fontWeight: 'bold' }}>{t.potassiumSupplementation}:</Text> {interpolate(t.potassiumMsg, { amount: totalPotassium.toFixed(2) })}
              </Text>
            </View>
            <View style={styles.recommendation}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.recommendationText}>
                <Text style={{ fontWeight: 'bold' }}>{t.budgetAllocation}:</Text> {interpolate(t.budgetMsg, { amount: grandTotalCost.toFixed(2) })}
              </Text>
            </View>
            <View style={styles.recommendation}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.recommendationText}>
                <Text style={{ fontWeight: 'bold' }}>{t.applicationSchedule}:</Text> {t.applicationMsg}
              </Text>
            </View>
            <View style={styles.recommendation}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.recommendationText}>
                <Text style={{ fontWeight: 'bold' }}>{t.monitoringProtocol}:</Text> {t.monitoringMsg}
              </Text>
            </View>
          </View>

          {/* Fertilizer Recommendations */}
          {fertilizerType && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {fertilizerType === 'organic' ? '🌱 ' + t.organic : '⚗️ ' + t.inorganic} {t.fertilizerRecommendations}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {interpolate(t.fertilizerSubtitle, { type: fertilizerType === 'organic' ? t.organic.toLowerCase() : t.inorganic.toLowerCase() })}
              </Text>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>{t.nutrient}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{t.fertilizerName}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{t.form}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>{t.npkRatio}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{t.price} (₹/kg)</Text>
                </View>

                {(fertilizerType === 'organic' ? organicFertilizers : inorganicFertilizers).nitrogen.map((fertilizer, index) => (
                  <View key={`nitrogen-${index}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{t.nitrogen} (N)</Text>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{fertilizer.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{fertilizer.form}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{fertilizer.npk || 'High Nitrogen'}</Text>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>₹{fertilizer.price}</Text>
                  </View>
                ))}

                {(fertilizerType === 'organic' ? organicFertilizers : inorganicFertilizers).phosphorous.map((fertilizer, index) => (
                  <View key={`phosphorous-${index}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{t.phosphorous} (P)</Text>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{fertilizer.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{fertilizer.form}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{fertilizer.npk || 'High Phosphorous'}</Text>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>₹{fertilizer.price}</Text>
                  </View>
                ))}

                {(fertilizerType === 'organic' ? organicFertilizers : inorganicFertilizers).potassium.map((fertilizer, index) => (
                  <View key={`potassium-${index}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{t.potassium} (K)</Text>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{fertilizer.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{fertilizer.form}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{fertilizer.npk || 'High Potassium'}</Text>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>₹{fertilizer.price}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>{t.footerTitle}</Text>
            <Text style={styles.footerText}>{t.footerSubtitle}</Text>
            <Text style={styles.footerText}>{t.support}: support@cropmanagement.com</Text>
            <Text style={styles.footerText}>{t.website}: www.cropmanagement.com</Text>
            <Text style={[styles.footerText, { fontSize: 8, marginTop: 8 }]}>
              {t.rightsReserved}
            </Text>
          </View>
        </Page>
      </Document>
    );

    const pdfBuffer = await pdf(<MyDocument />).toBuffer();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Generate email text content
function generateEmailText(samples, emailCount, language = 'en') {
  const t = translations[language] || translations.en;

  const currentDate = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .highlight { background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #1f2937; color: white; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌱 ${t.title}</h1>
        <p>${t.subtitle}</p>
        <p><strong>${t.generatedOn}:</strong> ${currentDate}</p>
      </div>

      <div class="content">
        <h2>📊 ${t.executiveSummary}</h2>
        <p>${t.emailGreeting}</p>
        
        <p>${t.emailIntro}</p>
        
        <ul>
          <li><strong>📈 ${samples.length} ${t.samplesAnalyzed}</strong> - ${t.emailListItem1}</li>
          <li><strong>💰 ${t.totalInvestment}</strong> - ${t.emailListItem2}</li>
          <li><strong>📋 ${t.expertRecommendations}</strong> - ${t.emailListItem3}</li>
          <li><strong>📊 ${t.chart || 'Visual Charts'}</strong> - ${t.emailListItem4}</li>
        </ul>

        <div class="highlight">
          <h3>${t.emailPdfTitle}</h3>
          <p>${t.emailPdfMsg}</p>
        </div>

        <h3>${t.whatInside}</h3>
        <ul>
          <li>${t.insideItem1}</li>
          <li>${t.insideItem2}</li>
          <li>${t.insideItem3}</li>
          <li>${t.insideItem4}</li>
          <li>${t.insideItem5}</li>
          <li>${t.insideItem6}</li>
        </ul>

        <p><strong>${t.nextSteps}</strong></p>
        <ol>
          <li>${t.step1}</li>
          <li>${t.step2}</li>
          <li>${t.step3}</li>
          <li>${t.step4}</li>
        </ol>
      </div>

      <div class="footer">
        <h3>🌱 ${t.footerTitle}</h3>
        <p>${t.footerSubtitle}</p>
        <p><strong>📧 ${t.support}:</strong> support@cropmanagement.com</p>
        <p><strong>🌐 ${t.website}:</strong> www.cropmanagement.com</p>
        <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
          ${t.autoMessage}
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateHTMLReport(samples, cropGroups, totalCost, reportData) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Group samples by crop for the report
  const groupedSamples = {};
  samples.forEach(sample => {
    if (!groupedSamples[sample.crop]) {
      groupedSamples[sample.crop] = [];
    }
    groupedSamples[sample.crop].push(sample);
  });

  // Calculate fertilizer requirements
  const cropOptions = [
    { name: "Wheat", values: { nitrogen: 90, phosphorous: 45, potassium: 45, temperature: 25, moisture: 15, ph: 7.0 } },
    { name: "Rice", values: { nitrogen: 110, phosphorous: 50, potassium: 60, temperature: 28, moisture: 20, ph: 6.5 } },
    { name: "Maize", values: { nitrogen: 80, phosphorous: 40, potassium: 50, temperature: 24, moisture: 12, ph: 6.8 } },
  ];

  const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;
  const prices = { nitrogen: 7, phosphorous: 8, potassium: 19 };

  let fertilizerSummaryHTML = '';
  let totalNitrogen = 0, totalPhosphorous = 0, totalPotassium = 0, grandTotalCost = 0;

  Object.entries(groupedSamples).forEach(([cropName, cropSamples]) => {
    const std = getStandardValues(cropName);
    let cropNitrogen = 0, cropPhosphorous = 0, cropPotassium = 0;

    cropSamples.forEach(sample => {
      cropNitrogen += Math.max(0, std.nitrogen - sample.nitrogen);
      cropPhosphorous += Math.max(0, std.phosphorous - sample.phosphorous);
      cropPotassium += Math.max(0, std.potassium - sample.potassium);
    });

    const cropCost = cropNitrogen * prices.nitrogen + cropPhosphorous * prices.phosphorous + cropPotassium * prices.potassium;
    totalNitrogen += cropNitrogen;
    totalPhosphorous += cropPhosphorous;
    totalPotassium += cropPotassium;
    grandTotalCost += cropCost;

    fertilizerSummaryHTML += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px; font-weight: 600; color: #1f2937; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);">
          <div style="display: flex; align-items: center;">
            <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
            ${cropName}
          </div>
        </td>
        <td style="padding: 16px; text-align: center; color: #374151; font-weight: 500;">${cropNitrogen.toFixed(2)} kg</td>
        <td style="padding: 16px; text-align: center; color: #374151; font-weight: 500;">${cropPhosphorous.toFixed(2)} kg</td>
        <td style="padding: 16px; text-align: center; color: #374151; font-weight: 500;">${cropPotassium.toFixed(2)} kg</td>
        <td style="padding: 16px; text-align: center; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); color: #166534; font-weight: 700; font-size: 16px; border-radius: 8px;">₹${cropCost.toFixed(2)}</td>
      </tr>
    `;
  });

  // Generate sample details HTML
  let sampleDetailsHTML = '';
  samples.forEach((sample, index) => {
    const std = getStandardValues(sample.crop);
    const rowBg = index % 2 === 0 ? '#f9fafb' : '#ffffff';
    sampleDetailsHTML += `
      <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 14px; text-align: center; font-weight: 600; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 6px 12px; border-radius: 20px; display: inline-block; font-size: 14px;">
            ${sample.day}
          </div>
        </td>
        <td style="padding: 14px; text-align: center; color: #374151; font-weight: 500;">${sample.crop}</td>
        <td style="padding: 14px; text-align: center; color: #374151;">${sample.nitrogen}</td>
        <td style="padding: 14px; text-align: center; color: #374151;">${sample.phosphorous}</td>
        <td style="padding: 14px; text-align: center; color: #374151;">${sample.potassium}</td>
        <td style="padding: 14px; text-align: center; color: #374151;">${sample.temperature}°C</td>
        <td style="padding: 14px; text-align: center; color: #374151;">${sample.moisture}%</td>
        <td style="padding: 14px; text-align: center; color: #374151; font-weight: 600;">${sample.ph}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional Soil Analysis Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #2d3748; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }
        .email-container { 
          max-width: 900px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }
        .header { 
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
          color: white; 
          padding: 50px 40px; 
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" patternUnits="userSpaceOnUse" width="100" height="100"><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1.5" fill="rgba(255,255,255,0.08)"/><circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.06)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          animation: float 20s infinite linear;
        }
        @keyframes float { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        @media print {
          .header::before { display: none; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
        .header h1 { 
          font-size: 42px; 
          margin-bottom: 15px; 
          font-weight: 700;
          text-shadow: 0 4px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .header p { 
          font-size: 18px; 
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        .header .date { 
          background: rgba(255,255,255,0.2); 
          padding: 12px 24px; 
          border-radius: 25px; 
          display: inline-block; 
          margin-top: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
          position: relative;
          z-index: 1;
        }
        .section { 
          margin: 0; 
          padding: 40px; 
          border-bottom: 1px solid #e2e8f0;
        }
        .section:last-child { border-bottom: none; }
        .section h2 { 
          color: #1a202c; 
          font-size: 28px;
          margin-bottom: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section h2::before {
          content: '';
          width: 6px;
          height: 30px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 3px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #4f46e5;
          display: block;
        }
        .stat-label {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          margin-top: 8px;
        }
        table { 
          width: 100%; 
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 25px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }
        th { 
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white; 
          padding: 20px 16px; 
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .total-row {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: white !important;
        }
        .total-row td {
          padding: 20px 16px !important;
          text-align: center !important;
          font-weight: 700 !important;
          font-size: 18px !important;
          color: white !important;
          border: none !important;
        }
        .recommendations {
          background: linear-gradient(135deg, #fef7e0 0%, #fef3c7 100%);
          border-radius: 16px;
          padding: 30px;
          margin-top: 20px;
          border-left: 6px solid #f59e0b;
        }
        .recommendations ul {
          list-style: none;
          padding: 0;
        }
        .recommendations li {
          padding: 12px 0;
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .recommendations li:last-child { border-bottom: none; }
        .recommendations li::before {
          content: '✓';
          background: #f59e0b;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .pricing-table {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 16px;
          padding: 30px;
          margin-top: 20px;
        }
        .pricing-table table {
          box-shadow: none;
          background: transparent;
        }
        .pricing-table th {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }
        .footer { 
          text-align: center; 
          padding: 50px 40px; 
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
        }
        .footer h3 {
          font-size: 24px;
          margin-bottom: 15px;
          color: #10b981;
        }
        .footer p {
          opacity: 0.8;
          margin-bottom: 10px;
        }
        .contact-info {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        @media (max-width: 600px) {
          body { padding: 20px 10px; }
          .section { padding: 20px; }
          .header { padding: 30px 20px; }
          .header h1 { font-size: 28px; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🌱 Professional Soil Analysis Report</h1>
          <p>Comprehensive Agricultural Assessment & Recommendations</p>
          <div class="date">
            <strong>Report Generated:</strong> ${currentDate}
          </div>
        </div>

        <div class="section">
          <h2>📊 Executive Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-number">${samples.length}</span>
              <div class="stat-label">Samples Analyzed</div>
            </div>
            <div class="stat-card">
              <span class="stat-number">${Object.keys(groupedSamples).length}</span>
              <div class="stat-label">Crop Types</div>
            </div>
            <div class="stat-card">
              <span class="stat-number">₹${grandTotalCost.toFixed(0)}</span>
              <div class="stat-label">Total Investment</div>
            </div>
            <div class="stat-card">
              <span class="stat-number">${(totalNitrogen + totalPhosphorous + totalPotassium).toFixed(1)}</span>
              <div class="stat-label">Total Fertilizer (kg)</div>
            </div>
          </div>
          
          <p style="font-size: 16px; color: #4a5568; text-align: center; margin-top: 20px;">
            <strong>Crops Analyzed:</strong> ${Object.keys(groupedSamples).join(' • ')}
          </p>
        </div>

        <div class="section">
          <h2>🔬 Detailed Sample Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Crop Type</th>
                <th>Nitrogen</th>
                <th>Phosphorous</th>
                <th>Potassium</th>
                <th>Temperature</th>
                <th>Moisture</th>
                <th>pH Level</th>
              </tr>
            </thead>
            <tbody>
              ${sampleDetailsHTML}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>💰 Investment Analysis & Cost Breakdown</h2>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
            Based on scientific crop requirements and current market rates, here's your optimized fertilizer investment plan:
          </p>
          
          <table>
            <thead>
              <tr>
                <th>Crop Type</th>
                <th>Nitrogen Required</th>
                <th>Phosphorous Required</th>
                <th>Potassium Required</th>
                <th>Investment Cost</th>
              </tr>
            </thead>
            <tbody>
              ${fertilizerSummaryHTML}
              <tr class="total-row">
                <td>TOTAL INVESTMENT</td>
                <td>${totalNitrogen.toFixed(2)} kg</td>
                <td>${totalPhosphorous.toFixed(2)} kg</td>
                <td>${totalPotassium.toFixed(2)} kg</td>
                <td>₹${grandTotalCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📈 Expert Recommendations</h2>
          <div class="recommendations">
            <ul>
              <li><strong>Nitrogen Management:</strong> Apply ${totalNitrogen.toFixed(2)} kg of nitrogen-based fertilizer in split doses for optimal uptake</li>
              <li><strong>Phosphorous Enhancement:</strong> Add ${totalPhosphorous.toFixed(2)} kg of phosphorous fertilizer during soil preparation</li>
              <li><strong>Potassium Supplementation:</strong> Use ${totalPotassium.toFixed(2)} kg of potassium fertilizer for improved crop resistance</li>
              <li><strong>Budget Allocation:</strong> Total investment of ₹${grandTotalCost.toFixed(2)} will maximize your crop yield potential</li>
              <li><strong>Application Schedule:</strong> Follow a systematic fertilizer application timeline for best results</li>
              <li><strong>Monitoring Protocol:</strong> Continue regular soil testing to track improvement progress</li>
            </ul>
          </div>
        </div>

        <div class="section">
          <h2>� Current Market Pricing</h2>
          <div class="pricing-table">
            <table>
              <thead>
                <tr>
                  <th>Nutrient Type</th>
                  <th>Price per kg</th>
                  <th>Quality Grade</th>
                  <th>Application Method</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: #ffffff;">
                  <td style="padding: 16px; font-weight: 600; color: #1f2937;">Nitrogen (N)</td>
                  <td style="padding: 16px; text-align: center; color: #059669; font-weight: 700;">₹7.00</td>
                  <td style="padding: 16px; text-align: center; color: #374151;">Premium Grade</td>
                  <td style="padding: 16px; text-align: center; color: #374151;">Soil Application</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 16px; font-weight: 600; color: #1f2937;">Phosphorous (P)</td>
                  <td style="padding: 16px; text-align: center; color: #059669; font-weight: 700;">₹8.00</td>
                  <td style="padding: 16px; text-align: center; color: #374151;">Premium Grade</td>
                  <td style="padding: 16px; text-align: center; color: #374151;">Root Zone</td>
                </tr>
                <tr style="background: #ffffff;">
                  <td style="padding: 16px; font-weight: 600; color: #1f2937;">Potassium (K)</td>
                  <td style="padding: 16px; text-align: center; color: #059669; font-weight: 700;">₹19.00</td>
                  <td style="padding: 16px; text-align: center; color: #374151;">Premium Grade</td>
                  <td style="padding: 16px; text-align: center; color: #374151;">Broadcast Application</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="footer">
          <h3>🌱 Crop Management System</h3>
          <p>Advanced Agricultural Analytics & Precision Farming Solutions</p>
          <p>This report was generated using state-of-the-art soil analysis algorithms</p>
          
          <div class="contact-info">
            <p><strong>📧 Support:</strong> support@cropmanagement.com</p>
            <p><strong>📞 Helpline:</strong> +91-XXXX-XXXX-XX</p>
            <p><strong>🌐 Website:</strong> www.cropmanagement.com</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; opacity: 0.6;">
            © 2025 Crop Management System. All rights reserved. | This is an automated report.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
