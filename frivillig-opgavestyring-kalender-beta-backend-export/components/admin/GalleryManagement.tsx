
import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { generateId, fileToBase64 } from '../../utils';
import { TrashIcon } from '../icons';
import toast from 'react-hot-toast';
import type { GalleryImage } from '../../types';

export const GalleryManagement: React.FC = () => {
    const { galleryImages, setGalleryImages, currentUser, tasks, users } = useData();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'size_desc' | 'name'>('date_desc');
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image resizing helper
    const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<{ data: string, width: number, height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve({
                    data: canvas.toDataURL('image/jpeg', 0.8), // Compress to JPEG 80%
                    width,
                    height
                });
            };
        });
    };

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (!currentUser) return;
        
        setUploading(true);
        const newImages: GalleryImage[] = [];
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const rawBase64 = await fileToBase64(file);
                const { data, width, height } = await resizeImage(rawBase64);
                
                // Check for duplicates (simple check by name and size approx)
                const isDuplicate = galleryImages.some(img => img.name === file.name && Math.abs(img.size - file.size) < 1000);
                
                if (!isDuplicate) {
                     newImages.push({
                        id: generateId(),
                        data: data,
                        name: file.name,
                        uploadDate: new Date().toISOString(),
                        size: file.size,
                        width: width,
                        height: height,
                        uploadedBy: currentUser.id,
                        tags: []
                    });
                }
            } catch (e) {
                console.error("Error processing file", file.name, e);
                errorCount++;
            }
        }

        if (newImages.length > 0) {
            setGalleryImages(prev => [...newImages, ...prev]); // Add new to top
            toast.success(`${newImages.length} billeder uploadet.`);
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} billeder kunne ikke behandles.`);
        }
        setUploading(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleDelete = (id: string) => {
        const image = galleryImages.find(img => img.id === id);
        if (!image) return;

        // Check usage
        const usedInTasks = tasks.filter(t => t.image === image.data);
        const usedInUsers = users.filter(u => u.image === image.data);

        if (usedInTasks.length > 0 || usedInUsers.length > 0) {
            const confirmMsg = `Dette billede bruges i ${usedInTasks.length} opgaver og af ${usedInUsers.length} brugere. Hvis du sletter det, vil det forsvinde fra disse steder. Er du sikker?`;
            if (!window.confirm(confirmMsg)) return;
        } else {
            if (!window.confirm("Er du sikker på, du vil slette dette billede?")) return;
        }

        setGalleryImages(prev => prev.filter(img => img.id !== id));
        toast.success("Billede slettet.");
    };
    
    const handleBulkDelete = () => {
        if (selectedImageIds.length === 0) return;
        if (window.confirm(`Slet ${selectedImageIds.length} valgte billeder?`)) {
             setGalleryImages(prev => prev.filter(img => !selectedImageIds.includes(img.id)));
             setSelectedImageIds([]);
             toast.success("Billeder slettet.");
        }
    }

    const handleAddTag = (imageId: string, tag: string) => {
        if (!tag.trim()) return;
        setGalleryImages(prev => prev.map(img => {
            if (img.id === imageId) {
                const currentTags = img.tags || [];
                if (!currentTags.includes(tag.trim())) {
                    return { ...img, tags: [...currentTags, tag.trim()] };
                }
            }
            return img;
        }));
    };

    const handleRemoveTag = (imageId: string, tagToRemove: string) => {
        setGalleryImages(prev => prev.map(img => {
            if (img.id === imageId) {
                return { ...img, tags: (img.tags || []).filter(t => t !== tagToRemove) };
            }
            return img;
        }));
    };

    const filteredImages = useMemo(() => {
        let result = galleryImages;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(img => 
                img.name.toLowerCase().includes(lower) || 
                (img.tags || []).some(tag => tag.toLowerCase().includes(lower))
            );
        }
        
        return result.sort((a, b) => {
            switch(sortOption) {
                case 'date_asc': return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
                case 'size_desc': return b.size - a.size;
                case 'name': return a.name.localeCompare(b.name);
                case 'date_desc': 
                default: return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
            }
        });
    }, [galleryImages, searchTerm, sortOption]);

    const formatBytes = (bytes: number, decimals = 0) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        {uploading ? "Uploader og optimerer..." : "Træk billeder herind"}
                    </p>
                    <p className="text-sm text-slate-500">eller</p>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={(e) => processFiles(e.target.files)} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Vælg Filer
                    </button>
                    <p className="text-xs text-slate-400 mt-2">Billeder over 800px bredde bliver automatisk skaleret ned.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <input 
                        type="text" 
                        placeholder="Søg efter navn eller tag..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded w-full md:w-64 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                    />
                    <select 
                        value={sortOption} 
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="p-2 border rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                    >
                        <option value="date_desc">Nyeste først</option>
                        <option value="date_asc">Ældste først</option>
                        <option value="size_desc">Største først</option>
                        <option value="name">Navn A-Å</option>
                    </select>
                </div>
                {selectedImageIds.length > 0 && (
                    <button onClick={handleBulkDelete} className="text-rose-600 hover:text-rose-700 font-medium text-sm">
                        Slet {selectedImageIds.length} valgte
                    </button>
                )}
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredImages.length} billeder
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map(img => (
                    <div key={img.id} className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                            <input 
                                type="checkbox" 
                                checked={selectedImageIds.includes(img.id)}
                                onChange={() => setSelectedImageIds(prev => prev.includes(img.id) ? prev.filter(id => id !== img.id) : [...prev, img.id])}
                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                        </div>
                        
                        {/* Delete Button */}
                        <button 
                            onClick={() => handleDelete(img.id)}
                            className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 p-1.5 rounded-full text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Slet billede"
                        >
                            <TrashIcon />
                        </button>

                        {/* Image */}
                        <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                            <img src={img.data} alt={img.name} className="w-full h-full object-cover object-center" loading="lazy" />
                        </div>

                        {/* Details */}
                        <div className="p-3">
                            <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200" title={img.name}>{img.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {img.width}x{img.height} • {formatBytes(img.size)}
                            </p>
                            
                            {/* Tags Input */}
                            <div className="mt-2 flex flex-wrap gap-1">
                                {(img.tags || []).map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(img.id, tag)} className="ml-1 text-rose-400 hover:text-rose-600">&times;</button>
                                    </span>
                                ))}
                                <input 
                                    type="text" 
                                    placeholder="+Tag" 
                                    className="text-[10px] bg-transparent border-none focus:ring-0 p-0 w-12 text-slate-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddTag(img.id, e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
