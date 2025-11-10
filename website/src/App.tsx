import { Routes, Route, Link } from 'react-router-dom'
import { CharacterList } from './components/CharacterList'
import CharacterCreate from './components/CharacterCreate'
import CharacterEdit from './components/CharacterEdit'
import ThemeToggle from './components/ThemeToggle'

function App() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PC Character Manager</h1>
                        <div className="flex items-center space-x-4">
                            <nav className="space-x-4">
                                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Characters</Link>
                                <Link to="/create" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Create Character</Link>
                            </nav>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                    <Route path="/" element={<CharacterList />} />
                    <Route path="/create" element={<CharacterCreate />} />
                    <Route path="/edit/:id" element={<CharacterEdit />} />
                </Routes>
            </main>
        </div>
    )
}

export default App