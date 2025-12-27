import { cookies } from "next/headers";
import { NextRequest, NextResponse, ProxyConfig } from "next/server";

export async function proxy(req:NextRequest)  {
    const cookie =await cookies()
    const path  = req.nextUrl.pathname;
    const token = cookie.get(process.env.COOKIE_NAME as string)?.value

    if(path === '/' && !token) {
        const url = new URL("/signup", req.url)
        return NextResponse.redirect(url)
    } 
    return NextResponse.next()
}

export const config :ProxyConfig ={
    matcher:['/:path']   
}