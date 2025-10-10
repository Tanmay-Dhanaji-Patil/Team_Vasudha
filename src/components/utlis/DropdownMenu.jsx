"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DropdownMenuRadioGroupDemo({ data, state, setState }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 dark:hover:from-green-900/20 dark:hover:to-blue-900/20 transition-all duration-300 shadow-lg hover:shadow-xl min-w-[140px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{state}</span>
          </div>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
        <DropdownMenuLabel className="text-gray-900 dark:text-white font-semibold flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Select Crop Type</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
        <DropdownMenuRadioGroup value={state} onValueChange={setState}>
          {data.map((crop) => (
            <DropdownMenuRadioItem 
              key={crop.name} 
              value={crop.name}
              className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 dark:hover:from-green-900/20 dark:hover:to-blue-900/20 transition-all duration-200 cursor-pointer py-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {crop.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{crop.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      pH: {crop.values["Soil pH"]} | Temp: {crop.values.Temperature}°C
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DropdownMenuRadioGroupDemo;