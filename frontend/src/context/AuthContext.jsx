import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const response = await api.get('/auth/me')
                setUser(response.data.user)
            } catch (error) {
                localStorage.removeItem('token')
                setUser(null)
            }
        }
        setLoading(false)
    }

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data
        localStorage.setItem('token', token)
        setUser(user)
        return user
    }

    const register = async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password })
        const { token, user } = response.data
        localStorage.setItem('token', token)
        setUser(user)
        return user
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    const updateUser = (updates) => {
        setUser(prev => ({ ...prev, ...updates }))
    }

    // Refresh user data from server
    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/me')
            setUser(response.data.user)
            return response.data.user
        } catch (error) {
            console.error('Failed to refresh user:', error)
            return null
        }
    }

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
