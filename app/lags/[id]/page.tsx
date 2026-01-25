"use client"
import NavigationButtonChapter from "@/components/Lags/NavigateButtonChapter";
import { LagChapterInterface, LagChapterInterfaceData } from "@/interface/lagChapter/lagchapter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const LagChapterPage = ()=>{
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<LagChapterInterfaceData[]>()
    useEffect(()=>{

        (async ()=>{
            let token ;
            if(typeof window !== "undefined"){
                token = localStorage.getItem(process.env.COOKIE_NAME as string)
            }
            if(!token){
                return router.replace("/signin")
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_LAG_CHAPTER}?subjectId=${params.id}`,{
                method:"GET",
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            })
            if(response.status == 401){
                return router.replace('/signin')
            }
            const responseData :LagChapterInterface = await response.json()
            setData(responseData.data)
        })()
    },[params, router])
    return (
        <div>
            {data?.map((chapter) => {
                const id = typeof chapter._id == "string" ? chapter._id : chapter._id.toString()
                return <NavigationButtonChapter _id={id} {...chapter}/>
            })}
        </div>
    )
}
export default LagChapterPage