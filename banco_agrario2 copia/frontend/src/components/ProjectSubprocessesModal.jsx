// ProjectSubprocessesModal.jsx - VERSIÓN CORREGIDA CON FONDO CLARO
import { useEffect } from "react";

export default function ProjectSubprocessesModal({ 
    isOpen, 
    onClose, 
    projectSubprocesses, 
    loadingSubprocesses 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Fondo transparente - NO OSCURO */}
            <div 
                className="absolute inset-0 bg-transparent" 
                onClick={onClose}
            />
            
            {/* Contenido del modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Subprocesos del Mes
                        </h2>
                        {projectSubprocesses && (
                            <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">{projectSubprocesses.project_name}</span>
                                {projectSubprocesses.resource_name && (
                                    <span> · Recurso: {projectSubprocesses.resource_name}</span>
                                )}
                                <span> · {projectSubprocesses.current_month}</span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loadingSubprocesses ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : projectSubprocesses ? (
                        <div className="space-y-6">
                            {/* Información del proyecto */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-blue-900">
                                            {projectSubprocesses.project_name}
                                        </h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Complejidad: <span className="font-medium">{projectSubprocesses.complexity}</span>
                                            {projectSubprocesses.resource_name && (
                                                <> · Recurso: <span className="font-medium">{projectSubprocesses.resource_name}</span></>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {projectSubprocesses.subprocesses?.length || 0}
                                        </div>
                                        <div className="text-sm text-blue-600">subprocesos</div>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de subprocesos */}
                            {projectSubprocesses.subprocesses && projectSubprocesses.subprocesses.length > 0 ? (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                        Subprocesos activos este mes:
                                    </h4>
                                    <div className="grid gap-3">
                                        {projectSubprocesses.subprocesses.map((subprocess, index) => (
                                            <div 
                                                key={index}
                                                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="font-medium text-gray-900">
                                                        {subprocess.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm text-gray-500">
                                                        {subprocess.count} {subprocess.count === 1 ? 'semana' : 'semanas'}
                                                    </span>
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-green-600 h-2 rounded-full" 
                                                            style={{ 
                                                                width: `${Math.min(100, (subprocess.count / 4) * 100)}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">
                                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">No hay subprocesos activos</p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {projectSubprocesses.resource_name 
                                            ? `El recurso ${projectSubprocesses.resource_name} no tiene subprocesos asignados este mes`
                                            : 'No hay subprocesos asignados este mes'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Información adicional */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium">Información:</p>
                                        <p className="mt-1">
                                            Los subprocesos mostrados corresponden únicamente al mes actual y 
                                            {projectSubprocesses.resource_name 
                                                ? ` al recurso ${projectSubprocesses.resource_name}.`
                                                : ' a todos los recursos asignados al proyecto.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No se pudieron cargar los subprocesos
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 bg-white">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}