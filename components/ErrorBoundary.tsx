import React from 'react';

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const title = this.props.title || 'Erro ao renderizar';
    return (
      <div className="p-6 bg-white rounded-2xl border border-red-200 shadow-sm">
        <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-2">{title}</div>
        <div className="text-sm font-black text-gray-900 mb-2">{this.state.error.message}</div>
        <pre className="text-[11px] whitespace-pre-wrap text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto max-h-[45vh]">
          {this.state.error.stack}
        </pre>
      </div>
    );
  }
}

