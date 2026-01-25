"use client"
import NavigateButton from '@/components/Lags/NavigateButton'
import { LagResponoseData, LagResponseDataInterface } from '@/interface/Lags/lagresponse'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const LagPage = ()=>{
    const [lagData, setLagData] = useState<LagResponseDataInterface[]>()
    const router = useRouter()
    useEffect(()=>{

        (async()=>{
            let token;
            if(typeof window !== "undefined"){
                token = localStorage.getItem(process.env.COOKIE_NAME as string)
            }
            const response  = await fetch(process.env.NEXT_PUBLIC_LAGS as string , {
                method:'GET',
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            })
            const responseData :LagResponoseData = await response.json()
            console.log(responseData.data)
            setLagData(responseData.data)
        })()
    },[])

    
    return (
        <div className='w-full bg-[#18181B] h-screen flex flex-col'>
            {lagData?.map((subject) => {
                const idString = typeof subject._id === "string" ? subject._id : subject._id.toString();
                return <NavigateButton key={idString} {...subject} _id={idString} />;
            })}
        </div>
    )
}

export default LagPage;