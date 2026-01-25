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
        router.push(`/lags/chapter/${id}`)
    }
    return (
        <button onClick={()=>handleNavigate(props._id as string)} className="m-4">
            {props.chapterName}
        </button>
    )
} 

export default NavigationButtonChapter