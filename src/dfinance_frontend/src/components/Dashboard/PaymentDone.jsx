import { Check, Wallet } from 'lucide-react'
import React from 'react'

const PaymentDone = ({ }) => {
    return (
        <>
        <div className="w-full flex flex-col items-center">
            <div className='border rounded-full p-2 my-3 text-green-500 border-green-500'>
                    <Check />
            </div>
            <h1 className='font-semibold text-xl'>All done !</h1>
            <p>You Supplies 1.0000000 LINK</p>

            <div className={"w-full my-2 focus:outline-none bg-gradient-to-r mt-6 text-white from-[#96959573] to-[#6463637d] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex items-center gap-3"}>
                    <img src={"/connect_wallet_icon.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                Add aToken to wallet to track your balance.
            </div>

            <button className={"my-2 bg-gradient-to-r text-white mt-6 from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm flex items-center gap-2"}>
                <Wallet />
                Add to wallet
            </button>
            </div>
        </>
    )
}

export default PaymentDone