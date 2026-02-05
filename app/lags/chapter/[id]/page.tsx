"use client"
import { useParams, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useOptimistic, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react'

interface ChapterBody {
    _id:string
    body:string
}

const ChapterBodyPage = ()=>{
    const [data, setData] = useState<ChapterBody[]>([])
    const params = useParams()
    const {id} = params
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newBody, setNewBody] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingBody, setEditingBody] = useState('')
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const router = useRouter()
    const [limit , setLimit ]= useState<number>(5)
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
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        if(!token){
            return router.replace('/signin')
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAG_BODY}?lagChapterId=${id}&page=${currentPage}&limit=${limit}`,{
            method:'GET',
            headers:{
                "Authorization":`Bearer ${token}`
            }
        })

        if(response.status === 401){
            return router.replace('/signin')
        }

        const responseData = await response.json()
        setData(responseData.data)
        if (isInitial) setIsInitialLoading(false)
    }

    useEffect(()=>{
        fetchData(page, true)
    },[router, params, page])

    const handleAddBody = async () => {
        if (!newBody.trim()) return
        
        // Create temporary item for optimistic update
        const tempItem: ChapterBody = {
            _id: 'temp-' + Date.now(),
            body: newBody
        }
        
        // Immediately update BOTH optimistic and actual data state
        setOptimisticData({ action: 'add', item: tempItem })
        setData(prev => [tempItem, ...prev])
        
        // Clear form and close immediately
        const bodyToSave = newBody
        setNewBody('')
        setIsAdding(false)
        
        // Background API call
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:'POST',
                headers:{
                    "Authorization":`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({_id: id, body: bodyToSave})
            })
            
            if(response.ok){
                const result = await response.json()
                // Replace temp item with real data from server
                setData(prev => [result.data, ...prev.filter(item => item._id !== tempItem._id)])
            } else {
                // Revert on error
                setData(prev => prev.filter(item => item._id !== tempItem._id))
                alert('Failed to add lag point. Please try again.')
            }
        } catch (error) {
            console.log(error)
            // Revert on error
            setData(prev => prev.filter(item => item._id !== tempItem._id))
            alert('Failed to add lag point. Please try again.')
        }
    }

    const handleEditBody = async (bodyId: string) => {
        if (!editingBody.trim()) return
        
        // Optimistic update - update BOTH states immediately
        const updatedItem = { _id: bodyId, body: editingBody }
        setOptimisticData({ action: 'edit', item: updatedItem })
        setData(prev => prev.map(item => 
            item._id === bodyId ? updatedItem : item
        ))
        
        // Clear edit state immediately
        const bodyToSave = editingBody
        setEditingId(null)
        setEditingBody('')
        
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:"PATCH",
                headers:{
                    "Authorization":`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({_id: bodyId, body: bodyToSave})
            })
            
            if(!response.ok){
                // Revert on error
                fetchData(page)
                alert('Failed to update lag point. Please try again.')
            }
            // If successful, data is already updated optimistically
        } catch (error) {
            console.log(error)
            // Revert on error
            fetchData(page)
            alert('Failed to update lag point. Please try again.')
        }
    }

    const handleDeleteBody = async (_id:string)=>{
        // Optimistic delete - update BOTH states immediately
        setOptimisticData({ action: 'delete', _id })
        setData(prev => prev.filter(item => item._id !== _id))
        
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:'DELETE',
                headers:{
                    "Authorization":`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({_id})
            })
            
            if(!response.ok){
                // Revert on error
                fetchData(page)
                alert('Failed to delete lag point. Please try again.')
            }
            // If successful, data is already deleted optimistically
        } catch (error) {
            console.log(error)
            // Revert on error
            fetchData(page)
            alert('Failed to delete lag point. Please try again.')
        }
    }

    const startEdit = (id: string, body: string) => {
        setEditingId(id)
        setEditingBody(body)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingBody('')
    }

    return (
        <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4'>
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
                    <div className='bg-card-bg p-4 rounded mb-4'>
                        <textarea
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                            placeholder='Enter lag point'
                            className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                            rows={4}
                            autoFocus
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddBody}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
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
                            Loading lag points...
                        </div>
                    ) : optimisticData && optimisticData.length > 0 ? (
                        optimisticData.map((item) => (
                            <div key={item._id} className='bg-card-bg p-4 rounded cursor-pointer hover:bg-[#3a3a3a] transition-colors'>
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
                                            <button
                                                onClick={() => handleEditBody(item._id)}
                                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                                            >
                                                <Save size={16} />
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className='text-text mb-2 whitespace-pre-wrap'>{item.body}</p>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() => startEdit(item._id, item.body)}
                                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                                            >
                                                <Edit2 size={16} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBody(item._id)}
                                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className='text-center text-text py-8'>
                            <p className='mb-4'>No lag points found for this chapter. Add your first lag point!</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2 mx-auto'
                            >
                                <Plus size={16} />
                                Add Your First Lag Point
                            </button>
                        </div>
                    )}
                </div>

               {/* Pagination & Limit Controller */}
<div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-gray-700 pt-4'>
    
    {/* Limit Selector */}
    <div className='flex items-center gap-2 text-text'>
        <label htmlFor="limit" className="text-sm">Items per page:</label>
        <select
            id="limit"
            value={limit}
            onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1); // Reset to page 1 when limit changes
            }}
            className='bg-card-bg text-text border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-button-bg'
        >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
        </select>
    </div>

    {/* Page Navigation */}
    <div className='flex items-center gap-2'>
        <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50 transition-opacity'
        >
            Previous
        </button>
        
        <span className='text-text font-medium px-2'>
            Page {page}
        </span>

        <button
            onClick={() => setPage(page + 1)}
            disabled={data.length < limit} // Disable if current data is less than limit
            className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50 transition-opacity'
        >
            Next
        </button>
    </div>
</div>
            </div>
        </div>
    )
}

const ChapterBodyContent = ()=>{
    return (
        <Suspense fallback={<><div>Loading...</div></>}>
            <ChapterBodyPage></ChapterBodyPage>
        </Suspense>
    )
}
export default ChapterBodyContent