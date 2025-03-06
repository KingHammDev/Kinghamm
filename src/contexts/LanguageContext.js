'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(undefined)

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState('zh')
    const [translations, setTranslations] = useState({})

    // 載入翻譯檔案的函數
    const loadTranslations = async (lang) => {
        try {
            // 動態引入語言檔
            const newTranslations = await import(`../locales/${lang}.json`)
            setTranslations(newTranslations.default)
            // 儲存使用者的語言選擇
            localStorage.setItem('userLanguage', lang)
        } catch (error) {
            console.error(`Failed to load language file for ${lang}:`, error)
        }
    }

    useEffect(() => {
        // 從 localStorage 讀取使用者之前選擇的語言
        const savedLanguage = localStorage.getItem('userLanguage')
        if (savedLanguage) {
            setCurrentLanguage(savedLanguage)
            // 載入儲存的語言翻譯
            loadTranslations(savedLanguage)
        } else {
            // 如果沒有儲存的語言，載入預設語言 'zh' 的翻譯
            loadTranslations(currentLanguage)
        }
    }, [])

    const setLanguage = async (lang) => {
        setCurrentLanguage(lang)
        await loadTranslations(lang)
    }

    return (
        <LanguageContext.Provider value={{ currentLanguage, setLanguage, translations }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}