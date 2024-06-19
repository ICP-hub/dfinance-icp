export const Card = () => {
    return (
        <div class="flex justify-center items-center h-screen pt-10">

            <div class="bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 p-10 rounded-xl shadow-xl max-w-lg mx-auto">
                <div class="text-center space-y-4">
                    <h1 class="text-2xl font-semibold">Please, connect your wallet</h1>
                    <p class="text-gray-700">Please connect your wallet to see your supplies, borrowings anf open positions.</p>
                    <button class="bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 text-white font-bold py-2 px-4 rounded-full hover:shadow-lg transition ease-in duration-300">Create Wallet</button>
                </div>
            </div>

        </div>
    )
}

