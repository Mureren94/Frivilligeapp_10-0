import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { generateId, fileToBase64 } from '../../utils';
import { TrashIcon } from '../icons';
import toast from 'react-hot-toast';
import type { GalleryImage } from '../../types';
import { api } from '../../services/api'; // VIGTIGT: Vi bruger nu API'et

export const GalleryManagement: React.FC = () => {
    const { galleryImages, setGalleryImages, currentUser } = useData();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'size_desc' | 'name'>('date_desc');
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Billed-komprimering
    const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<{ data: string, width: number, height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) { height = Math.round((height * maxWidth) / width); width = maxWidth; } 
                    else { width = Math.round((width * maxHeight) / height); height = maxHeight; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve({ data: canvas.toDataURL('image/jpeg', 0.8), width, height });
            };
        });
    };

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (!currentUser) return;
        setUploading(true);
        let count = 0;
        let errors = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const rawBase64 = await fileToBase64(file);
                const { data, width, height } = await resizeImage(rawBase64);
                
                const newImg = {
                    id: generateId(),
                    data: data, // Dette er selve billed-dataen (base64)
                    name: file.name,
                    uploadDate: new Date().toISOString(),
                    size: file.size,
                    width: width,
                    height: height,
                    uploadedBy: currentUser.id,
                    tags: []
                };

                // HER ER FORSKELLEN: Vi sender billedet til serveren!
                const savedImg = await api.uploadGalleryImage(newImg) as GalleryImage;
                
                // Opdater listen med det billede, vi fik tilbage fra serveren
                setGalleryImages(prev => [savedImg, ...prev]); 
                count++;
            } catch (e) {
                console.error("Error processing file", file.name, e);
                errors++;
            }
        }

        if (count > 0) toast.success(`${count} billeder uploadet.`);
        if (errors > 0) toast.error(`${errors} billeder fejlede.`);
        setUploading(false);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Er du sikker på, du vil slette dette billede?")) return;
        try {
            // Slet på serveren
            await api.deleteGalleryImage(id);
            // Slet lokalt
            setGalleryImages(prev => prev.filter(img => img.id !== id));
            toast.success("Billede slettet.");
        } catch (e) {
            toast.error("Kunne ikke slette billede.");
        }
    };
    
    const handleBulkDelete = async () => {
        if (selectedImageIds.length === 0) return;
        if (window.confirm(`Slet ${selectedImageIds.length} valgte billeder?`)) {
             // Slet én efter én (simpelt)
             for (const id of selectedImageIds) {
                 await api.deleteGalleryImage(id);
             }
             setGalleryImages(prev => prev.filter(img => !selectedImageIds.includes(img.id)));
             setSelectedImageIds([]);
             toast.success("Billeder slettet.");
        }
    }

    const filteredImages = useMemo(() => {
        let result = galleryImages;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(img => img.name.toLowerCase().includes(lower));
        }
        return result.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }, [galleryImages, searchTerm, sortOption]);

    const formatBytes = (bytes: number) => { if (!+bytes) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(0))} ${sizes[i]}`; };

    return (
        <div className="space-y-6">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">{uploading ? "Uploader..." : "Træk billeder herind"}</p>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => processFiles(e.target.files)} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors">Vælg Filer</button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <input 
                        id="gallery-search"
                        name="gallery-search"
                        aria-label="Søg i galleri"
                        type="text" 
                        placeholder="Søg..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="p-2 border rounded w-full md:w-64 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" 
                    />
                    <select 
                        id="gallery-sort"
                        name="gallery-sort"
                        aria-label="Sorter galleri"
                        value={sortOption} 
                        onChange={(e) => setSortOption(e.target.value as any)} 
                        className="p-2 border rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                    >
                        <option value="date_desc">Nyeste først</option>
                        <option value="date_asc">Ældste først</option>
                    </select>
                </div>
                {selectedImageIds.length > 0 && (<button onClick={handleBulkDelete} className="text-rose-600 hover:text-rose-700 font-medium text-sm">Slet {selectedImageIds.length} valgte</button>)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map(img => (
                    <div key={img.id} className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="absolute top-2 left-2 z-10">
                            <input 
                                type="checkbox" 
                                id={`gallery-select-${img.id}`}
                                name={`gallery-select-${img.id}`}
                                aria-label={`Vælg billede ${img.name}`}
                                checked={selectedImageIds.includes(img.id)} 
                                onChange={() => setSelectedImageIds(prev => prev.includes(img.id) ? prev.filter(id => id !== img.id) : [...prev, img.id])} 
                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                            />
                        </div>
                        <button onClick={() => handleDelete(img.id)} className="absolute top-2 right-2 z-10 bg-white/80 p-1.5 rounded-full text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                        <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                            {/* VIGTIGT: Vi bruger api.getImageUrl her for at hente billedet fra serveren */}
                            <img src={api.getImageUrl(img.data)} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="p-3"><p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">{img.name}</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
};