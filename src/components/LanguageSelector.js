import { useLanguage } from '../contexts/LanguageContext'

const LanguageSelector = () => {
    const { currentLanguage, setLanguage } = useLanguage()

    const languages = [
        { code: 'zh', name: '中文' },
        { code: 'en', name: 'English' }
    ]

    return (
        <div className="language-selector">
            <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="p-2 rounded border border-gray-300"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default LanguageSelector