function LoginPage() {
    return (
    <div className="h-screen flex flex-col items-center justify-center space-y-8">
      <h1 className="text-4xl font-bold">Mahjong.io</h1>
      <div className="flex flex-col space-y-4 w-40">
        <a href="/gamemode">
          <button className="w-full rounded-md border px-4 py-2">
            Play
          </button>
        </a>
        <a href="/quizmode">
          <button className="w-full rounded-md border px-4 py-2">
            Quiz
          </button>
        </a>
      </div>
    </div>
    )
}

export default LoginPage