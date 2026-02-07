"use client"
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useOptimistic, useState, startTransition } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, AlertTriangle, Search, Filter } from 'lucide-react'

type LagType = "question" | "formula" | "theory" | "approach" | "mistake" | "learning" | "trick" | "revisit"

interface ChapterBody {
    _id: string
    body: string
    type?: LagType
}

// Declare MathJax type globally
declare global {
    interface Window {
        MathJax: any;
    }
}

// Type color configuration with glassy effects
const typeColors: Record<LagType, { bg: string; border: string; text: string; badge: string }> = {
    question: { 
        bg: 'bg-blue-500/10 hover:bg-blue-500/20', 
        border: 'border-blue-500/30', 
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    },
    formula: { 
        bg: 'bg-purple-500/10 hover:bg-purple-500/20', 
        border: 'border-purple-500/30', 
        text: 'text-purple-400',
        badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    },
    theory: { 
        bg: 'bg-green-500/10 hover:bg-green-500/20', 
        border: 'border-green-500/30', 
        text: 'text-green-400',
        badge: 'bg-green-500/20 text-green-300 border border-green-500/30'
    },
    approach: { 
        bg: 'bg-yellow-500/10 hover:bg-yellow-500/20', 
        border: 'border-yellow-500/30', 
        text: 'text-yellow-400',
        badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    },
    mistake: { 
        bg: 'bg-red-500/10 hover:bg-red-500/20', 
        border: 'border-red-500/30', 
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-300 border border-red-500/30'
    },
    learning: { 
        bg: 'bg-cyan-500/10 hover:bg-cyan-500/20', 
        border: 'border-cyan-500/30', 
        text: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
    },
    trick: { 
        bg: 'bg-pink-500/10 hover:bg-pink-500/20', 
        border: 'border-pink-500/30', 
        text: 'text-pink-400',
        badge: 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
    },
    revisit: { 
        bg: 'bg-orange-500/10 hover:bg-orange-500/20', 
        border: 'border-orange-500/30', 
        text: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    }
}

const typeLabels: Record<LagType, string> = {
    question: "Question",
    formula: "Formula",
    theory: "Theory",
    approach: "Approach",
    mistake: "Mistake",
    learning: "Learning",
    trick: "Trick",
    revisit: "Revisit"
}

// Skeleton Loader Component for Lag Points
const LagPointSkeleton = () => {
    return (
        <div className='bg-card-bg p-4 rounded border border-transparent animate-pulse'>
            <div className='mb-4 space-y-2'>
                <div className='h-4  w-full border-2 bg-[#252525] border-white/10 rounded-full'></div>
                <div className='h-4 bg-[#252525]  w-5/6 border-2 border-white/10 rounded-full'></div>
                <div className='h-4 bg-[#252525]  w-4/6 border-2 border-white/10 rounded-full'></div>
            </div>
            <div className='flex gap-3 border-t border-[#252525] pt-3'>
                <div className='h-5 bg-[#252525]  rounded w-16 border-2  border-white/10'></div>
                <div className='h-5 bg-[#252525] rounded w-16  border-2 border-white/10'></div>
            </div>
        </div>
    )
}

// Multiple Skeleton Loaders
const SkeletonLoader = ({ count = 3 }: { count?: number }) => {
    return (
        <div className='grid gap-4'>
            {Array.from({ length: count }).map((_, index) => (
                <LagPointSkeleton key={index} />
            ))}
        </div>
    )
}

const ChapterBodyPage = () => {
    const [data, setData] = useState<ChapterBody[]>([])
    const params = useParams()
    const { id } = params
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newBody, setNewBody] = useState('')
    const [newType, setNewType] = useState<LagType>('question')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingBody, setEditingBody] = useState('')
    const [editingType, setEditingType] = useState<LagType>('question')
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [limit, setLimit] = useState<number>(5)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [mathJaxLoaded, setMathJaxLoaded] = useState(false)
    const [typeFilter, setTypeFilter] = useState<LagType | 'all'>('all')
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [activeTypeDropdown, setActiveTypeDropdown] = useState<string | null>(null)
    
    // State for Delete Confirmation Modal
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const router = useRouter()
    
    const [optimisticData, setOptimisticData] = useOptimistic(
        data,
        (state, newData: { action: 'add' | 'edit' | 'delete', item?: ChapterBody, _id?: string }) => {
            if (newData.action === 'add' && newData.item) {
                return [newData.item, ...state]
            }
            if (newData.action === 'edit' && newData.item) {
                return state.map(item =>
                    item._id === newData.item!._id ? newData.item! : item
                )
            }
            if (newData.action === 'delete' && newData._id) {
                return state.filter(item => item._id !== newData._id)
            }
            return state
        }
    )

    // Load MathJax dynamically
    useEffect(() => {
        const loadMathJax = () => {
            // Check if MathJax is already loaded
            if (window.MathJax) {
                setMathJaxLoaded(true)
                return
            }

            // Configure MathJax
            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true,
                    processEnvironments: true
                },
                options: {
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                },
                startup: {
                    ready: () => {
                        window.MathJax.startup.defaultReady()
                        setMathJaxLoaded(true)
                    }
                }
            }

            // Load MathJax script
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
            script.async = true
            document.head.appendChild(script)
        }

        loadMathJax()
    }, [])

    // Typeset MathJax when data changes
    useEffect(() => {
        if (mathJaxLoaded && optimisticData.length > 0) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise()
                        .catch((err: any) => console.log('MathJax error:', err))
                }
            }, 100)
        }
    }, [optimisticData, mathJaxLoaded, editingId])

    const fetchData = async (currentPage: number = 1, isInitial: boolean = false, query: string = '', filter: LagType | 'all' = 'all') => {
        if (isInitial) setIsInitialLoading(true)
        if (query) setIsSearching(true)
        
        let token;
        if (typeof window !== "undefined") {
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        if (!token) {
            return router.replace('/signin')
        }

        // Build URL with search query and type filter parameters
        let url = `${process.env.NEXT_PUBLIC_LAG_BODY}?lagChapterId=${id}&page=${currentPage}&limit=${limit}`
        if (query) {
            url += `&q=${encodeURIComponent(query)}`
        }
        if (filter !== 'all') {
            url += `&type=${filter}`
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })

        if (response.status === 401) {
            return router.replace('/signin')
        }

        const responseData = await response.json()
        setData(responseData.data)
        if (isInitial) setIsInitialLoading(false)
        if (query) setIsSearching(false)
    }

    useEffect(() => {
        fetchData(page, true, searchQuery, typeFilter)
    }, [router, params, page, limit, searchQuery, typeFilter])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.type-dropdown-container')) {
                setActiveTypeDropdown(null);
            }
            if (!target.closest('.filter-dropdown-container')) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearchQuery(searchInput)
        setPage(1) // Reset to first page when searching
    }

    const handleClearSearch = () => {
        setSearchInput('')
        setSearchQuery('')
        setPage(1)
    }

    const handleFilterChange = (filter: LagType | 'all') => {
        setTypeFilter(filter)
        setPage(1)
        setShowFilterDropdown(false)
    }

    const handleAddBody = async () => {
        if (!newBody.trim()) return

        const tempItem: ChapterBody = {
            _id: 'temp-' + Date.now(),
            body: newBody,
            type: newType
        }

        startTransition(() => {
            setOptimisticData({ action: 'add', item: tempItem })
            setData(prev => [tempItem, ...prev])
        })

        const bodyToSave = newBody
        const typeToSave = newType
        setNewBody('')
        setNewType('question')
        setIsAdding(false)

        let token;
        if (typeof window !== "undefined") {
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: id, body: bodyToSave, type: typeToSave })
            })

            if (response.ok) {
                const result = await response.json()
                startTransition(() => {
                    setData(prev => [result.data, ...prev.filter(item => item._id !== tempItem._id)])
                })
            } else {
                startTransition(() => {
                    setData(prev => prev.filter(item => item._id !== tempItem._id))
                })
                alert('Failed to add lag point.')
            }
        } catch (error) {
            startTransition(() => {
                setData(prev => prev.filter(item => item._id !== tempItem._id))
            })
            alert('Error occurred.')
        }
    }

    const handleEditBody = async (bodyId: string) => {
        if (!editingBody.trim()) return

        const updatedItem = { _id: bodyId, body: editingBody, type: editingType }
        
        startTransition(() => {
            setOptimisticData({ action: 'edit', item: updatedItem })
            setData(prev => prev.map(item =>
                item._id === bodyId ? updatedItem : item
            ))
        })

        const bodyToSave = editingBody
        const typeToSave = editingType
        setEditingId(null)
        setEditingBody('')

        let token;
        if (typeof window !== "undefined") {
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: bodyId, body: bodyToSave, type: typeToSave })
            })

            if (!response.ok) {
                fetchData(page, false, searchQuery, typeFilter)
                alert('Failed to update.')
            }
        } catch (error) {
            fetchData(page, false, searchQuery, typeFilter)
        }
    }

    const handleTypeChange = async (bodyId: string, newType: LagType) => {
        setActiveTypeDropdown(null); // Close dropdown immediately
        
        const currentItem = optimisticData.find(item => item._id === bodyId)
        if (!currentItem) return

        const updatedItem = { ...currentItem, type: newType }
        
        startTransition(() => {
            setOptimisticData({ action: 'edit', item: updatedItem })
            setData(prev => prev.map(item =>
                item._id === bodyId ? updatedItem : item
            ))
        })

        let token;
        if (typeof window !== "undefined") {
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: bodyId, type: newType })
            })

            if (!response.ok) {
                // Revert on failure
                fetchData(page, false, searchQuery, typeFilter)
                alert('Failed to update type.')
            }
        } catch (error) {
            fetchData(page, false, searchQuery, typeFilter)
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        const _id = deleteConfirmId;
        
        // Close modal first
        setDeleteConfirmId(null);

        startTransition(() => {
            setOptimisticData({ action: 'delete', _id })
            setData(prev => prev.filter(item => item._id !== _id))
        })

        let token;
        if (typeof window !== "undefined") {
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id })
            })

            if (!response.ok) {
                fetchData(page, false, searchQuery, typeFilter)
                alert('Failed to delete.')
            }
        } catch (error) {
            fetchData(page, false, searchQuery, typeFilter)
        }
    }

    const startEdit = (id: string, body: string, type?: LagType) => {
        setEditingId(id)
        setEditingBody(body)
        setEditingType(type || 'question')
    }

    const getItemBorderClass = (type?: LagType) => {
        if (!type) return 'border-gray-700'
        return typeColors[type].border
    }

    const getItemBgClass = (type?: LagType) => {
        if (!type) return 'hover:border-gray-600'
        return typeColors[type].bg
    }

    return (
        <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4 relative'>
            
            {/* DELETE CONFIRMATION MODAL */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card-bg border border-gray-700 w-full max-w-md rounded-lg shadow-2xl p-6 transform transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-500/10 p-2 rounded-full">
                                <AlertTriangle className="text-red-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-text">Confirm Deletion</h3>
                        </div>
                        
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete this lag point? This action cannot be undone.
                        </p>
                        
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 rounded font-medium text-text hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='w-full max-w-4xl'>
                <div className='flex items-center gap-4 mb-4'>
                    <button
                        onClick={() => router.back()}
                        className='bg-button-bg text-button-text p-2 rounded hover:bg-opacity-80'
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className='text-text text-2xl font-bold'>Lag Points</h1>
                </div>

                {/* Search Bar and Filter */}
                <div className='mb-4 space-y-3'>
                    <form onSubmit={handleSearch} className='flex gap-2'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                            <input
                                type='text'
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder='Search lag points...'
                                className='w-full pl-10 pr-4 py-2 bg-card-bg text-text border border-gray-700 rounded focus:border-button-bg outline-none'
                            />
                        </div>
                        <button
                            type='submit'
                            className='bg-button-bg text-button-text px-6 py-2 rounded hover:bg-opacity-80 transition-colors'
                            disabled={isSearching}
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                        {searchQuery && (
                            <button
                                type='button'
                                onClick={handleClearSearch}
                                className='bg-gray-700 text-text px-4 py-2 rounded hover:bg-gray-600 transition-colors'
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    {/* Filter Dropdown */}
                    <div className='relative filter-dropdown-container'>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 px-4 py-2 rounded border transition-colors ${
                                typeFilter !== 'all' 
                                    ? `${typeColors[typeFilter].badge}` 
                                    : 'bg-card-bg border-gray-700 text-gray-300 hover:border-gray-600'
                            }`}
                        >
                            <Filter size={16} />
                            {typeFilter === 'all' ? 'All Types' : typeLabels[typeFilter]}
                        </button>

                        {showFilterDropdown && (
                            <div className='absolute top-full left-0 mt-2 bg-card-bg border border-gray-700 rounded-lg shadow-xl z-10 min-w-50 backdrop-blur-sm'>
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors first:rounded-t-lg ${
                                        typeFilter === 'all' ? 'bg-white/10' : ''
                                    }`}
                                >
                                    <span className='text-gray-300'>All Types</span>
                                </button>
                                {(Object.keys(typeColors) as LagType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleFilterChange(type)}
                                        className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors last:rounded-b-lg ${
                                            typeFilter === type ? 'bg-white/10' : ''
                                        }`}
                                    >
                                        <span className={`inline-block px-2 py-1 rounded text-xs ${typeColors[type].badge}`}>
                                            {typeLabels[type]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {(searchQuery || typeFilter !== 'all') && (
                        <div className='flex gap-2 items-center text-sm'>
                            {searchQuery && (
                                <span className='text-gray-400'>
                                    Search: <span className='text-button-bg font-medium'>"{searchQuery}"</span>
                                </span>
                            )}
                            {typeFilter !== 'all' && (
                                <span className={`px-2 py-1 rounded text-xs ${typeColors[typeFilter].badge}`}>
                                    {typeLabels[typeFilter]}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className='flex justify-end mb-4'>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                    >
                        <Plus size={16} />
                        Add Lag Point
                    </button>
                </div>

                {isAdding && (
                    <div className='bg-card-bg p-4 rounded mb-4 border border-gray-700'>
                        {/* Type Selection */}
                        <div className='mb-3'>
                            <label className='text-sm text-gray-400 mb-2 block'>Type</label>
                            <div className='flex flex-wrap gap-2'>
                                {(Object.keys(typeColors) as LagType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewType(type)}
                                        className={`px-3 py-1.5 rounded text-sm transition-all ${
                                            newType === type
                                                ? `${typeColors[type].badge} ring-2 ring-offset-2 ring-offset-card-bg ${typeColors[type].border.replace('border-', 'ring-')}`
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        {typeLabels[type]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                            placeholder='Enter lag point (use $ for inline math, $$ for display math)'
                            className='w-full p-2 bg-primary-bg text-text border border-gray-600 rounded focus:border-button-bg outline-none'
                            rows={4}
                            autoFocus
                        />
                        <div className='flex gap-2 mt-2'>
                            <button onClick={handleAddBody} className='bg-button-bg text-button-text px-4 py-2 rounded'>Add</button>
                            <button onClick={() => { setIsAdding(false); setNewType('question'); }} className='bg-gray-700 text-text px-4 py-2 rounded'>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Replace loading spinner with skeleton */}
                {isInitialLoading ? (
                    <SkeletonLoader count={5} />
                ) : (
                    <div className='grid gap-4'>
                        {optimisticData && optimisticData.length > 0 ? (
                            optimisticData.map((item) => (
                                <div 
                                    key={item._id} 
                                    className={`bg-card-bg p-4 rounded border transition-all ${getItemBorderClass(item.type)} ${getItemBgClass(item.type)}`}
                                >
                                    {editingId === item._id ? (
                                        <div>
                                            {/* Type Selection in Edit Mode */}
                                            <div className='mb-3'>
                                                <label className='text-sm text-gray-400 mb-2 block'>Type</label>
                                                <div className='flex flex-wrap gap-2'>
                                                    {(Object.keys(typeColors) as LagType[]).map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setEditingType(type)}
                                                            className={`px-3 py-1.5 rounded text-sm transition-all ${
                                                                editingType === type
                                                                    ? `${typeColors[type].badge} ring-2 ring-offset-2 ring-offset-card-bg ${typeColors[type].border.replace('border-', 'ring-')}`
                                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            {typeLabels[type]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <textarea
                                                value={editingBody}
                                                onChange={(e) => setEditingBody(e.target.value)}
                                                placeholder='Use $ for inline math or $$ for display math'
                                                className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                                                rows={4}
                                                autoFocus
                                            />
                                            <div className='flex gap-2 mt-2'>
                                                <button onClick={() => handleEditBody(item._id)} className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'><Save size={16} /> Save</button>
                                                <button onClick={() => setEditingId(null)} className='bg-gray-700 text-text px-4 py-2 rounded flex items-center gap-2'><X size={16} /> Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className='text-text mb-4 whitespace-pre-wrap leading-relaxed math-content'>
                                                {item.body}
                                            </div>
                                            <div className='flex justify-between items-center border-t border-gray-800 pt-3'>
                                                <div className='flex gap-3'>
                                                    <button
                                                        onClick={() => startEdit(item._id, item.body, item.type)}
                                                        className='text-gray-400 hover:text-button-bg flex items-center gap-1 text-sm transition-colors'
                                                    >
                                                        <Edit2 size={14} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(item._id)}
                                                        className='text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm transition-colors'
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                                
                                                {/* Type Badge with Quick Change */}
                                                <div className='relative type-dropdown-container'>
                                                    <button
                                                        onClick={() => setActiveTypeDropdown(activeTypeDropdown === item._id ? null : item._id)}
                                                        className={`px-2 py-1 rounded text-xs cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-offset-card-bg ${
                                                            item.type 
                                                                ? `${typeColors[item.type].badge} ${activeTypeDropdown === item._id ? 'ring-2 ring-offset-1 ring-offset-card-bg ' + typeColors[item.type].border.replace('border-', 'ring-') : ''}` 
                                                                : 'bg-gray-700 text-gray-400 border border-gray-600'
                                                        }`}
                                                    >
                                                        {item.type ? typeLabels[item.type] : 'No Type'}
                                                    </button>
                                                    
                                                    {/* Type Change Dropdown */}
                                                    {activeTypeDropdown === item._id && (
                                                        <div className='absolute bottom-full right-0 mb-2 bg-card-bg border border-gray-700 rounded-lg shadow-xl z-20 min-w-35 backdrop-blur-sm'>
                                                            {(Object.keys(typeColors) as LagType[]).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => handleTypeChange(item._id, type)}
                                                                    className={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                                                        item.type === type ? 'bg-white/10' : ''
                                                                    }`}
                                                                >
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs ${typeColors[type].badge}`}>
                                                                        {typeLabels[type]}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className='text-center text-text py-12 bg-card-bg rounded-lg border border-dashed border-gray-700'>
                                <p className='mb-4 opacity-60'>
                                    {searchQuery || typeFilter !== 'all' 
                                        ? `No results found` 
                                        : 'No lag points found.'}
                                </p>
                                {!searchQuery && typeFilter === 'all' && (
                                    <button onClick={() => setIsAdding(true)} className='bg-button-bg text-button-text px-4 py-2 rounded inline-flex items-center gap-2'>
                                        <Plus size={16} /> Add First Point
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 border-t border-gray-800 pt-6'>
                    <div className='flex items-center gap-2 text-text'>
                        <span className="text-sm opacity-60">Show:</span>
                        <select
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className='bg-card-bg text-text border border-gray-700 rounded px-2 py-1 outline-none'
                        >
                            {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>

                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className='bg-card-bg text-text px-4 py-2 rounded disabled:opacity-30 border border-gray-700 hover:bg-gray-800 transition-colors'
                        >
                            Previous
                        </button>
                        <span className='text-text font-medium'>Page {page}</span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={data.length < limit}
                            className='bg-card-bg text-text px-4 py-2 rounded disabled:opacity-30 border border-gray-700 hover:bg-gray-800 transition-colors'
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ChapterBodyContent = () => {
    return (
        <Suspense fallback={
            <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4'>
                <div className='w-full max-w-4xl'>
                    <div className='flex items-center gap-4 mb-4'>
                        <div className='bg-gray-700 p-2 rounded w-10 h-10 animate-pulse'></div>
                        <div className='h-8 bg-gray-700 rounded w-32 animate-pulse'></div>
                    </div>
                    <div className='mb-4'>
                        <div className='h-10 bg-gray-700 rounded w-full animate-pulse'></div>
                    </div>
                    <div className='flex justify-end mb-4'>
                        <div className='bg-gray-700 rounded h-10 w-40 animate-pulse'></div>
                    </div>
                    <SkeletonLoader count={5} />
                </div>
            </div>
        }>
            <ChapterBodyPage />
        </Suspense>
    )
}

export default ChapterBodyContent