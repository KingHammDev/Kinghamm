import { useLanguage } from '../contexts/LanguageContext'

export const useTranslation = () => {
    const { translations } = useLanguage()

    const t = (key, params) => {
        const keys = key.split('.')
        let value = translations

        for (const k of keys) {
            value = value?.[k]
            if (!value) return key // 如果找不到翻譯，返回原始 key
        }

        if (params) {
            return Object.entries(params).reduce((acc, [key, val]) => {
                return acc.replace(`{{${key}}}`, val)
            }, value)
        }

        return value
    }

    return { t }
}