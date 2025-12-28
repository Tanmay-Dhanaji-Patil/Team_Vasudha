# Python Setup Guide for ML Model Integration

## 🐍 **Error: Python Not Found**

If you're seeing the error "Python not found", follow these steps to install and configure Python.

## 📥 **Install Python**

### **Option 1: Download from Python.org (Recommended)**

1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or 3.12 (latest stable version)
3. **IMPORTANT:** During installation, check the box:
   - ✅ **"Add Python to PATH"** (or "Add python.exe to PATH")
4. Click "Install Now"
5. Verify installation:
   ```powershell
   python --version
   ```

### **Option 2: Use Microsoft Store**

1. Open Microsoft Store
2. Search for "Python 3.11" or "Python 3.12"
3. Click "Install"
4. Verify:
   ```powershell
   python --version
   ```

### **Option 3: Use Anaconda/Miniconda**

1. Download from https://www.anaconda.com/download
2. Install Anaconda
3. Anaconda automatically adds Python to PATH
4. Verify:
   ```powershell
   python --version
   ```

## ✅ **Verify Installation**

Open PowerShell or Command Prompt and run:

```powershell
python --version
```

You should see something like:
```
Python 3.11.5
```

If you see an error, Python is not in your PATH.

## 🔧 **Add Python to PATH (If Not Already Added)**

### **Windows 10/11:**

1. Search for "Environment Variables" in Windows Search
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under "System variables", find and select "Path"
5. Click "Edit"
6. Click "New"
7. Add these paths (adjust version number if different):
   ```
   C:\Users\YourUsername\AppData\Local\Programs\Python\Python311
   C:\Users\YourUsername\AppData\Local\Programs\Python\Python311\Scripts
   ```
8. Click "OK" on all dialogs
9. **Restart your terminal/IDE** for changes to take effect

### **Alternative: Use Python Launcher (py)**

Windows usually includes a Python launcher. Try:

```powershell
py --version
```

If this works, the API will automatically use `py` command.

## 📦 **Install Required Python Packages**

After Python is installed, install required packages:

```powershell
pip install pandas numpy scikit-learn joblib
```

Or if `pip` doesn't work:

```powershell
python -m pip install pandas numpy scikit-learn joblib
```

Or with Python launcher:

```powershell
py -m pip install pandas numpy scikit-learn joblib
```

## 🧪 **Test Python Installation**

Create a test file `test_python.py`:

```python
import sys
print(f"Python version: {sys.version}")
print("✓ Python is working!")
```

Run it:

```powershell
python test_python.py
```

## 🔍 **Troubleshooting**

### **Issue: "python is not recognized"**

**Solution:**
1. Reinstall Python with "Add to PATH" checked
2. Or manually add Python to PATH (see above)
3. Restart terminal/IDE

### **Issue: "pip is not recognized"**

**Solution:**
```powershell
python -m pip install pandas numpy scikit-learn joblib
```

### **Issue: Multiple Python Versions**

**Solution:**
Use Python launcher:
```powershell
py -3.11 --version  # Use specific version
py -3 --version     # Use latest Python 3
```

### **Issue: Permission Denied**

**Solution:**
```powershell
python -m pip install --user pandas numpy scikit-learn joblib
```

## ✅ **Verify Everything Works**

After setup, test the ML model:

1. Start your Next.js server:
   ```powershell
   npm run dev
   ```

2. Fill the form and click "Get ML Recommendations"

3. Check browser console for any errors

4. Check server terminal for Python execution logs

## 📝 **Quick Checklist**

- [ ] Python 3.7+ installed
- [ ] Python added to PATH
- [ ] `python --version` works
- [ ] Required packages installed (`pandas`, `numpy`, `scikit-learn`, `joblib`)
- [ ] Next.js server restarted after Python installation
- [ ] Test "Get ML Recommendations" button

## 🆘 **Still Having Issues?**

1. **Check Python location:**
   ```powershell
   where python
   where py
   ```

2. **Check Python version:**
   ```powershell
   python --version
   py --version
   ```

3. **Check installed packages:**
   ```powershell
   pip list
   ```

4. **Restart everything:**
   - Close all terminals
   - Restart VS Code/IDE
   - Restart Next.js server

5. **Check server logs:**
   - Look at terminal where `npm run dev` is running
   - Check for Python-related errors

## 🎯 **Expected Behavior**

Once Python is properly installed:

1. Click "Get ML Recommendations" button
2. See "Predicting..." loading state
3. See fertilizer recommendations displayed
4. No error messages

If you still see errors, check the server terminal logs for detailed error messages.

