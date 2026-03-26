import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("AppErrorBoundary", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl p-6 bg-card border border-border flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Ошибка экрана
            </p>
            <h1 className="text-xl font-bold mt-2">Страница сломалась, приложение живо</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Можно вернуться на главную или перезагрузить экран.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={this.handleHome}
              className="flex-1 h-11 rounded-2xl bg-muted text-foreground font-semibold"
            >
              На главную
            </button>
            <button
              onClick={this.handleReload}
              className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-semibold"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }
}
