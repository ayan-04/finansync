// src/app/auth/signin/[[...rest]]/page.tsx
"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-700 to-purple-800 relative">
      <div className="flex flex-col items-center w-full flex-1 justify-center">
        {/* Heading and subheading only, no logo */}
        <h1 className="font-extrabold text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md text-center mb-1">
          Welcome to <span className="text-yellow-400">FinanSync</span>
        </h1>
        <p className="text-indigo-100 mb-4 text-center text-base">
          Secure, effortless money management starts here
        </p>
        {/* Clerk Sign In */}
        <div className="w-full max-w-md rounded-2xl bg-white/95 shadow-2xl p-5 sm:p-8 space-y-4 mx-auto">
          <SignIn
            appearance={{
              elements: {
                card: "bg-transparent shadow-none p-0 w-full",
                formButtonPrimary: "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-md",
                headerTitle: "text-xl sm:text-2xl font-bold text-center text-blue-700",
                headerSubtitle: "text-gray-500 font-medium text-center",
                socialButtonsBlockButton: "bg-white text-gray-900 border border-gray-200 hover:bg-yellow-50 mb-2",
                footerAction: "text-gray-600 text-center",
                formFieldInput: "rounded-lg border-gray-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-300",
                formFieldLabel: "font-semibold text-gray-800",
              },
              variables: {
                colorPrimary: "#7c3aed",
                borderRadius: "1rem",
                fontSize: "1rem"
              }
            }}
            afterSignInUrl="/dashboard"
            redirectUrl="/dashboard"
            routing="path"
            path="/auth/signin"
          />
        </div>
      </div>
      <footer className="w-full flex-none py-3 mt-4">
        <div className="text-xs text-indigo-200 opacity-80 text-center">
          © {new Date().getFullYear()} FinanSync. All rights reserved.<br />
          <span className="opacity-90">Smart, beautiful finance for everyone.</span>
        </div>
      </footer>
      {/* Optional: Prevent scroll */}
      <style>{`body { overflow: hidden; }`}</style>
    </div>
  )
}
