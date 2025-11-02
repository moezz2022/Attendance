"use client";
import { Download, Upload, Plus } from "lucide-react";
import React from "react";

type Props = {
  onAdd: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
};

export default function HeaderActions({ onAdd, onImportFile, onExport }: Props) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onExport}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
        <Download size={18} /> تصدير
      </button>
      <input
        type="file"
        accept=".xlsx, .xls"
        id="excelUpload"
        className="hidden"
        onChange={onImportFile}/>
      <button
        onClick={() => document.getElementById("excelUpload")?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
        <Upload size={18} /> استيراد
      </button>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Plus size={18} /> إضافة موظف
      </button>
    </div>
  );
}


