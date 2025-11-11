import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.fatal('Uncaught error in React component', error, {
            errorInfo,
            componentStack: errorInfo.componentStack
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Something went wrong
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
                            </p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}