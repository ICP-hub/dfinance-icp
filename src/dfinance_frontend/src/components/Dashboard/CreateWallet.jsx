import React, { useEffect } from 'react'
import Button from '../Button'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setIsWalletCreated } from '../../redux/reducers/utilityReducer'

const CreateWallet = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const {isWalletCreated} = useSelector(state => state.utility)

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

          <Button title="Create Wallet" onClickHandler={() => dispatch(setIsWalletCreated(true))}/>
      </div>
  )
}

export default CreateWallet