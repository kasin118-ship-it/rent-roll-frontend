"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Trash2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step3DocumentsProps {
    documents: File[];
    onAddDocuments: (files: File[]) => void;
    onRemoveDocument: (index: number) => void;
}

export function Step3Documents({ documents, onAddDocuments, onRemoveDocument }: Step3DocumentsProps) {
    const { t } = useLanguage();

    const onDrop = (acceptedFiles: File[]) => {
        onAddDocuments(acceptedFiles);
        toast.success(`Attached ${acceptedFiles.length} file(s)`);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/msword': ['.doc', '.docx'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxSize: 10485760 // 10MB
    });

    return (
        <div className="space-y-6">
            <div>
                <CardTitle className="text-xl text-teal-700">{t("contracts.wizard.uploadDocs")}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t("contracts.wizard.attachDocs")}</p>
            </div>

            {/* Upload Area */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-gold-500 bg-gold-50/50" : "border-gray-200 hover:border-gold-400 hover:bg-gray-50"
                    }`}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-gold-600" />
                </div>
                {isDragActive ? (
                    <p className="text-gold-700 font-medium">{t("contracts.wizard.dropFiles")}</p>
                ) : (
                    <>
                        <p className="text-gray-600 font-medium">{t("contracts.wizard.dragDrop")}</p>
                        <p className="text-sm text-gray-400 mt-2">{t("contracts.wizard.orClick")}</p>
                    </>
                )}
                <p className="text-xs text-gray-400 mt-4">{t("contracts.wizard.supportedFiles")}</p>
                <Button variant="outline" className="mt-6 border-gold-300 text-gold-600 hover:bg-gold-50" onClick={(e) => e.preventDefault()}>
                    {t("contracts.wizard.browse")}
                </Button>
            </div>

            {/* File List */}
            {documents && documents.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-gray-600">{t("contracts.wizard.attachedFiles")} ({documents.length})</Label>
                    <div className="grid gap-3">
                        {documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveDocument(index)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Google Cloud Info Alert */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                <div className="mt-1">
                    <Cloud className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-blue-800">{t("contracts.wizard.storageInfo")}</h4>
                    <p className="text-xs text-blue-600 mt-1">
                        {t("contracts.wizard.storageDesc")}
                    </p>
                </div>
            </div>
        </div>
    );
}
