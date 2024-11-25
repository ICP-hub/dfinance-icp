import React from 'react'
import { useNavigate } from 'react-router-dom';
import Element from "../../public/element/Elements.svg";
import { useDispatch, useSelector } from 'react-redux'
import Astro from "../../public/Error/astro.png";
import Globe from "../../public/Error/globe.png";
import { useAuth } from "../utils/useAuthClient"
import WalletModal from '../components/Dashboard/WalletModal';

const Error = () => {
    
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { isSwitchingWallet, connectedWallet } = useSelector(state => state.utility)
    console.log("isWalletswitching", isSwitchingWallet, connectedWallet)

    const {
        isAuthenticated
    } = useAuth()

    const handleTakeMeBack = () => {
        navigate('/');
    };
    return (
        <div className="relative w-full md:w-9/12 mx-auto my-6 min-h-[380px] md:min-h-[530px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd select-none">
            <div className="absolute right-0 top-0 h-full w-full ss1:w-full lg:w-1/2 md:w-full pointer-events-none">
                <img
                    src={Element}
                    alt="Elements"
                    className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
                // Ensure image scales properly
                />
            </div>
            <div className="text-center flex flex-col items-center relative mt-20 md:-mt-20">
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-2">
                    <div className="text-[140px] sm:text-[100px] md:text-[250px] font-light text-white dark:text-darkText -rotate-12" style={{ fontFamily: 'Vampiro One' }}>4</div>
                    <div className="flex flex-col items-center relative">
                        <img
                            src={Astro}
                            alt="Astronaut"
                            className="w-24 h-24 sm:w-24 sm:h-24 md:w-40 md:h-40 subtle-bounce relative z-40 lg:top-[-5px] left-[14px]" // Added lg:mt-[-100px]
                            style={{ marginTop: '-80px', marginLeft: '5px' }}
                        />
                        <img
                            src={Globe}
                            alt="Globe"
                            className="w-24 h-24 sm:w-20 sm:h-20 md:w-40 md:h-40 absolute bottom-0 left-0 z-0"
                            style={{ marginBottom: '-50px' }} // Adjusted margin-bottom
                        />
                    </div>
                    <div className="text-[140px] sm:text-[100px] md:text-[250px] font-light text-white dark:text-darkText -rotate-12" style={{ fontFamily: 'Vampiro One' }}>4</div>
                </div>

                <p className="text-lg sm:text-xl mb-2 text-[#2A1F9D] font-bold dark:text-darkText -mt-8 md:-mt-12">Uh-oh! Lost in Space</p>
                <p className="text-base sm:text-lg mb-6 text-[#2A1F9D] text-opacity-75 dark:text-darkText md:mb-8">The page you are trying to reach does not exist.</p>

                <button
                    className="px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold rounded-md bg-gradient-to-r from-[#EB8863] to-[#81198E] hover:from-[#EB6B63] hover:to-[#7B0F7E] transition-colors duration-300 ease-in-out"
                    onClick={handleTakeMeBack}
                >
                    Take me Back!
                </button>
            </div>

            {(isSwitchingWallet || !isAuthenticated) && (
                <WalletModal />
            )}
        </div>
    );
}

export default Error;
