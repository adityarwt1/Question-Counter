"use client"
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export const Navbar = ()=>{
    const router = useRouter()

    return (
        <nav className="flex w-full bg-primary-bg p-4 border-b border-card-bg">
            <div className="font-mono w-[70%] text-xl text-text">Exam-Booster</div>
            <div className="flex w-[30%] justify-evenly">
                <Link href='/' className="text-text hover:text-button-bg transition-colors">Home</Link>
                <Link href='/lags' className="text-text hover:text-button-bg transition-colors">Lag</Link>
            </div>
        </nav>
    )
}

export default Navbar