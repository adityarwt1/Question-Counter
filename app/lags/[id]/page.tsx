"use client"
import { LagChapterInterface, LagChapterInterfaceData } from "@/interface/lagChapter/lagchapter";
import { useParams, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useOptimistic, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from "next/link";

const LagChapterPage = ()=>{
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<LagChapterInterfaceData[]>([])
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newChapterName, setNewChapterName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isHover, setIsHover] = useState<string>("")
    const [limit , setLimit ] = useState<number>(10)
    const [optimisticData, setOptimisticData] = useOptimistic(
        data,
        (state, newData: { action: 'add' | 'edit' | 'delete', item?: LagChapterInterfaceData, _id?: string }) => {
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
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        if(!token){
            return router.replace("/signin")
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAG_CHAPTER}?subjectId=${params.id}&page=${currentPage}&limit=${limit}`,{
            method:"GET",
            headers:{
                "Authorization":`Bearer ${token}`
            }
        })
        if(response.status == 401){
            return router.replace('/signin')
        }
        const responseData: LagChapterInterface = await response.json()
        if(responseData.data) setData(responseData.data)
        if (isInitial) setIsInitialLoading(false)
    }

    useEffect(()=>{
        fetchData(page, true)
    },[params, page])

    const handleAddChapter = async () => {
        if (!newChapterName.trim()) return
        
        // Create temporary item for optimistic update
        const tempItem: LagChapterInterfaceData = {
            _id: 'temp-' + Date.now(),
            chapterName: newChapterName
        }
        
        // Immediately update UI
        setOptimisticData({ action: 'add', item: tempItem })
        
        // Clear form and close immediately
        const nameToSave = newChapterName
        setNewChapterName('')
        setIsAdding(false)
        
        // Background API call
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_CHAPTER as string, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subjectId: params.id, chapterName: nameToSave })
            })
            
            if (response.ok) {
                const result = await response.json()
                // Replace temp item with real data from server
                setData(prev => [result.data, ...prev.filter(item => item._id !== tempItem._id)])
            } else {
                // Revert on error
                setData(prev => prev.filter(item => item._id !== tempItem._id))
                alert('Failed to add chapter. Please try again.')
            }
        } catch (error) {
            console.error(error)
            // Revert on error
            setData(prev => prev.filter(item => item._id !== tempItem._id))
            alert('Failed to add chapter. Please try again.')
        }
    }

    const handleEditChapter = async (id: string) => {
        if (!editingName.trim()) return
        
        // Optimistic update
        const updatedItem = { _id: id, chapterName: editingName }
        setOptimisticData({ action: 'edit', item: updatedItem })
        
        // Clear edit state immediately
        const nameToSave = editingName
        setEditingId(null)
        setEditingName('')
        
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_CHAPTER as string, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: id, chapterName: nameToSave })
            })
            
            if (response.ok) {
                // Update with confirmed data
                setData(prev => prev.map(item => 
                    item._id === id ? { _id: id, chapterName: nameToSave } : item
                ))
            } else {
                // Revert on error
                fetchData(page)
                alert('Failed to update chapter. Please try again.')
            }
        } catch (error) {
            console.error(error)
            // Revert on error
            fetchData(page)
            alert('Failed to update chapter. Please try again.')
        }
    }

    const handleDeleteChapter = async (id: string) => {
        // Optimistic delete
        setOptimisticData({ action: 'delete', _id: id })
        
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_CHAPTER as string, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: id })
            })
            
            if (response.ok) {
                // Confirm deletion
                setData(prev => prev.filter(item => item._id !== id))
            } else {
                // Revert on error
                fetchData(page)
                alert('Failed to delete chapter. Please try again.')
            }
        } catch (error) {
            console.error(error)
            // Revert on error
            fetchData(page)
            alert('Failed to delete chapter. Please try again.')
        }
    }

    const startEdit = (id: string, name: string) => {
        setEditingId(id)
        setEditingName(name)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingName('')
    }

    // Keyboard event handlers
    const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddChapter()
        } else if (e.key === 'Escape') {
            setIsAdding(false)
            setNewChapterName('')
        }
    }

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            handleEditChapter(id)
        } else if (e.key === 'Escape') {
            cancelEdit()
        }
    }
    
    return (
        <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4'>
            <div className='w-full max-w-4xl'>
                <div className='flex items-center gap-4 mb-4'>
                    <button
                        onClick={() => router.push('/lags')}
                        className='bg-button-bg text-button-text p-2 rounded hover:bg-opacity-80'
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className='text-text text-2xl font-bold'>Chapters</h1>
                </div>
                <div className='flex justify-end mb-4'>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                    >
                        <Plus size={16} />
                        Add Chapter
                    </button>
                </div>

                {isAdding && (
                    <div className='bg-card-bg p-4 rounded mb-4'>
                        <input
                            type='text'
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            onKeyDown={handleAddKeyDown}
                            placeholder='Enter chapter name (Press Enter to add, Esc to cancel)'
                            className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                            autoFocus
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddChapter}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false)
                                    setNewChapterName('')
                                }}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className='grid gap-4'>
                    {isInitialLoading ? (
                        <div className='text-center text-text py-8'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4'></div>
                            Loading chapters...
                        </div>
                    ) : optimisticData && optimisticData.length > 0 ? (
                        optimisticData.map((chapter) => {
                            const id = typeof chapter._id == "string" ? chapter._id : chapter._id.toString()
                            return (
                                <div key={id} className='bg-card-bg p-4 rounded flex items-center justify-between cursor-pointer hover:bg-[#3a3a3a] transition-colors'>
                                    {editingId === id ? (
                                        <div className='flex-1 flex items-center gap-2'>
                                            <input
                                                type='text'
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => handleEditKeyDown(e, id)}
                                                placeholder='Press Enter to save, Esc to cancel'
                                                className='flex-1 p-2 bg-primary-bg text-text border border-text rounded'
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleEditChapter(id)}
                                                className='bg-button-bg text-button-text p-2 rounded'
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className='bg-button-bg text-button-text p-2 rounded'
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Link
                                                href={`/lags/chapter/${id}` as any}
                                                prefetch={isHover === id}
                                                onMouseEnter={()=> setIsHover(id)}
                                                className='flex-1 text-left text-text hover:text-white'
                                            >
                                                {chapter.chapterName}
                                            </Link>
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() => startEdit(id, chapter.chapterName)}
                                                    className='bg-button-bg text-button-text p-2 rounded'
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChapter(id)}
                                                    className='bg-button-bg text-button-text p-2 rounded'
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className='text-center text-text py-8'>
                            <p className='mb-4'>No chapters found for this subject. Add your first chapter!</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2 mx-auto'
                            >
                                <Plus size={16} />
                                Add Your First Chapter
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagination & Limit Controller */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-card-bg p-3 rounded border border-gray-800'>
                    <div className='flex items-center gap-3 text-text text-sm'>
                        <span>Rows per page:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1); // Reset to page 1 when limit changes
            }}
                            className='bg-primary-bg border border-gray-700 rounded px-2 py-1 outline-none focus:border-button-bg'
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className='text-text disabled:opacity-30 hover:bg-primary-bg p-2 rounded-full transition-colors'
                        >
                            <ChevronLeft size={24} />
                        </button>
                        
                        <span className='text-text font-semibold bg-primary-bg px-4 py-1 rounded border border-gray-700'>
                            Page {page}
                        </span>

                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={data.length < limit}
                            className='text-text disabled:opacity-30 hover:bg-primary-bg p-2 rounded-full transition-colors'
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                    </div>
            </div>
        </div>
    )
}

const LagChapterPageContent = ()=>{
    return (
        <Suspense fallback={<><div>Loading...</div></>}>
            <LagChapterPage/>
        </Suspense>
    )
}
export default LagChapterPageContent