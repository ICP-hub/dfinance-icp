import React, { useEffect, useState } from 'react'
import Button from '../Button'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setIsWalletCreated } from '../../redux/reducers/utilityReducer'
import { Modal } from '@mui/material'

const CreateWallet = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const {isWalletCreated} = useSelector(state => state.utility)
    const [connectWalletOpen, setConnectWalletOpen] = useState(false)

    const handleWalletConnect = () => {
        setConnectWalletOpen(!connectWalletOpen)
        // dispatch(setIsWalletCreated(true))
    }

    useEffect(() => {
       if(isWalletCreated){
           navigate('/dashboard/wallet-details')
       }
    }, [isWalletCreated]);
  return (
      <div className="w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[450px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6">
          <h1 className="text-[#2A1F9D] font-semibold my-2 text-lg">
              Please, connect your wallet
          </h1>
          <p className="text-[#737373] my-2 font-medium text-center">
              Please connect your wallet to see your supplies, borrowings anf
              open positions.
          </p>

          <Button title="Connect Wallet" onClickHandler={handleWalletConnect}/>

          <Modal open={connectWalletOpen} onClose={handleWalletConnect}>
              <div className='w-[300px] absolute bg-gradient-to-r from-[#242151] via-[#262353] to-[#2F2D61] bg-opacity-75 shadow-xl filter backdrop-blur-lg rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white'>
                  <h1 className='font-semibold'>Connect a wallet</h1>
                  <div className='flex flex-col gap-2 mt-3 text-sm'>
                      <div className="w-full flex items-center justify-between bg-[#1A173E] hover:bg-[#13112c] cursor-pointer p-2 rounded-md">
                          Wallet name
                          <div className='w-8 h-8'>
                              <img src={"/connect_wallet_icon.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                          </div>
                      </div>
                      <div className="w-full flex items-center justify-between bg-[#1A173E] hover:bg-[#13112c] cursor-pointer p-2 rounded-md">
                          Wallet name
                          <div className='w-8 h-8'>
                              <img src={"/connect_wallet_icon.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                          </div>
                      </div>
                      <div className="w-full flex items-center justify-between bg-[#1A173E] hover:bg-[#13112c] cursor-pointer p-2 rounded-md">
                          Wallet name
                          <div className='w-8 h-8'>
                              <img src={"/connect_wallet_icon.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                          </div>
                      </div>
                  </div>
                  <p className='w-full text-center text-xs my-3'>Track wallet balance in read-only mode</p>

                  <div className="w-full">
                      <input type="text" className='w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md' placeholder='Enter ethereum address or username'/>
                  </div>
                  <div className="w-full flex justify-center mt-3">
                      <Button title="Connect" onClickHandler={handleWalletConnect} className={"my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"}/>
                  </div>
                </div>
            </Modal>
      </div>
  )
}

export default CreateWallet