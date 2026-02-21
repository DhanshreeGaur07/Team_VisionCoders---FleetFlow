import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <TopBar />
                <div className="app-content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
