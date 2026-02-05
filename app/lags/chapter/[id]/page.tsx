"use client"
import { useParams, useRouter } from "next/navigation";
import  { Suspense, useEffect, useOptimistic, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, AlertTriangle } from 'lucide-react'

interface ChapterBody {
    _id: string
    body: string
}

const ChapterBodyPage = () => {
    const [data, setData] = useState<ChapterBody[]>([])
    const params = useParams()
    const { id } = params
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newBody, setNewBody] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingBody, setEditingBody] = useState('')
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [limit, setLimit] = useState<number>(5)
    
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

    const fetchData = async (currentPage: number = 1, isInitial: boolean = false) => {
        if (isInitial) setIsInitialLoading(true)
        let token;
        if (typeof window !== "undefined") {
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        if (!token) {
            return router.replace('/signin')
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAG_BODY}?lagChapterId=${id}&page=${currentPage}&limit=${limit}`, {
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
    }

    useEffect(() => {
        fetchData(page, true)
    }, [router, params, page, limit])

    const handleAddBody = async () => {
        if (!newBody.trim()) return

        const tempItem: ChapterBody = {
            _id: 'temp-' + Date.now(),
            body: newBody
        }

        setOptimisticData({ action: 'add', item: tempItem })
        setData(prev => [tempItem, ...prev])

        const bodyToSave = newBody
        setNewBody('')
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
                body: JSON.stringify({ _id: id, body: bodyToSave })
            })

            if (response.ok) {
                const result = await response.json()
                setData(prev => [result.data, ...prev.filter(item => item._id !== tempItem._id)])
            } else {
                setData(prev => prev.filter(item => item._id !== tempItem._id))
                alert('Failed to add lag point.')
            }
        } catch (error) {
            setData(prev => prev.filter(item => item._id !== tempItem._id))
            alert('Error occurred.')
        }
    }

    const handleEditBody = async (bodyId: string) => {
        if (!editingBody.trim()) return

        const updatedItem = { _id: bodyId, body: editingBody }
        setOptimisticData({ action: 'edit', item: updatedItem })
        setData(prev => prev.map(item =>
            item._id === bodyId ? updatedItem : item
        ))

        const bodyToSave = editingBody
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
                body: JSON.stringify({ _id: bodyId, body: bodyToSave })
            })

            if (!response.ok) {
                fetchData(page)
                alert('Failed to update.')
            }
        } catch (error) {
            fetchData(page)
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        const _id = deleteConfirmId;
        
        // Close modal first
        setDeleteConfirmId(null);

        setOptimisticData({ action: 'delete', _id })
        setData(prev => prev.filter(item => item._id !== _id))

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
                fetchData(page)
                alert('Failed to delete.')
            }
        } catch (error) {
            fetchData(page)
        }
    }

    const startEdit = (id: string, body: string) => {
        setEditingId(id)
        setEditingBody(body)
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
                        <textarea
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                            placeholder='Enter lag point'
                            className='w-full p-2 bg-primary-bg text-text border border-gray-600 rounded focus:border-button-bg outline-none'
                            rows={4}
                            autoFocus
                        />
                        <div className='flex gap-2 mt-2'>
                            <button onClick={handleAddBody} className='bg-button-bg text-button-text px-4 py-2 rounded'>Add</button>
                            <button onClick={() => setIsAdding(false)} className='bg-gray-700 text-text px-4 py-2 rounded'>Cancel</button>
                        </div>
                    </div>
                )}

                <div className='grid gap-4'>
                    {isInitialLoading ? (
                        <div className='text-center text-text py-8'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4'></div>
                            Loading...
                        </div>
                    ) : optimisticData && optimisticData.length > 0 ? (
                        optimisticData.map((item) => (
                            <div key={item._id} className='bg-card-bg p-4 rounded border border-transparent hover:border-gray-700 transition-all'>
                                {editingId === item._id ? (
                                    <div>
                                        <textarea
                                            value={editingBody}
                                            onChange={(e) => setEditingBody(e.target.value)}
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
                                        <p className='text-text mb-4 whitespace-pre-wrap leading-relaxed'>{item.body}</p>
                                        <div className='flex gap-3 border-t border-gray-800 pt-3'>
                                            <button
                                                onClick={() => startEdit(item._id, item.body)}
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
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className='text-center text-text py-12 bg-card-bg rounded-lg border border-dashed border-gray-700'>
                            <p className='mb-4 opacity-60'>No lag points found.</p>
                            <button onClick={() => setIsAdding(true)} className='bg-button-bg text-button-text px-4 py-2 rounded inline-flex items-center gap-2'><Plus size={16} /> Add First Point</button>
                        </div>
                    )}
                </div>

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
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-primary-bg text-text">Loading Layout...</div>}>
            <ChapterBodyPage />
        </Suspense>
    )
}

export default ChapterBodyContent