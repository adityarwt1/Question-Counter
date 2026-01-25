"use client"
import { useRouter } from "next/navigation"
import React from "react"

interface NavigationButtonChapterProps {
    _id:string,
    chapterName:string
}

const NavigationButtonChapter:React.FC<NavigationButtonChapterProps> = (props)=>{
    const router = useRouter()
    const handleNavigate = (id:string)=>{
        (router as any).push(`/lags/chapter/${id}`)
    }
    return (
        <button onClick={()=>handleNavigate(props._id as string)} className="w-full bg-[#27272A] text-[#e0e0e0] p-4 rounded text-left hover:bg-[#3a3a3a]">
            {props.chapterName}
        </button>
    )
} 

export default NavigationButtonChapter