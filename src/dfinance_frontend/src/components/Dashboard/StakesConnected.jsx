import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import Button from "../Button"

const StakesConnected = () => {
    const [isTestnetMode, setIsTestnetMode] = useState(""); // Add state for testnet mode
    const navigate = useNavigate(); // Initialize useNavigate

   
    const handleTestnetModeToggle = () => {
        setIsTestnetMode((prevMode) => !prevMode);
        if (!isTestnetMode) {
          navigate("/dashboard");
        }
      };
    return (
        <>
            {!isTestnetMode && (
                <div className="grid lg:grid-cols-2 sxs3:grid-cols-1 place-items-center gap-10">
                    {/* 1 */}
                    <div className="w-full min-h-[350px] p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative text-[#2A1F9D] dark:text-darkText mt-7">
                        <h2 className="font-bold text-[16px]">Stake Dfinance</h2>
                        <p className="text-[12px] dark:text-darkTextSecondary">Total Staked: 2.12 M ($213.59 M)</p>

                        <div className="flex flex-col gap-3">
                            <div className="border rounded-2xl mt-6 p-3">
                                <div className="flex justify-between align-center items-center">
                                    <div className="flex"><img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="mx-2 w-7 h-7" />
                                        <p className="font-bold text-[16px]">Dfinance</p>
                                    </div>
                                    <Button
                                        title={"Stake"}
                                        className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-6 py-[9px] shadow-2xl text-[14px]"
                                    />
                                </div>

                                <div className="w-full flex flex-wrap mt-3 whitespace-nowrap justify-between sxs3:flex-col lg:flex-row">
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">● Staking APR</h1>
                                        <p className="font-semibold text-[16px] ml-2">60%</p>
                                    </div>
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">
                                            ● Max Slashing
                                        </h1>

                                        <p className="font-semibold text-[16px] ml-2">40.00%</p>
                                    </div>
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">
                                            ● Wallet Balance
                                        </h1>

                                        <p className="font-semibold text-[16px] ml-2">0.00</p>
                                    </div>
                                </div>
                            </div>


                            <div className="border rounded-2xl mt-6 p-4">
                                <div className="grid lg:grid-cols-2 sxs3:grid-cols-1">
                                    <div className="flex lg:flex-col sxs3:flex-row">
                                        <p className="font-medium">Stake Dfinance</p>
                                        <div className="sxs3:ml-auto lg:m-0 sxs3:mb-2">
                                            <p className="font-medium">0 </p>
                                            <span className="font-light text-[10px]">$0</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 lg:mb-5">
                                        <Button
                                            title={"Cool down to stake"}
                                            className="w-full z-20 py-[13px] focus:outline-none box bg-transparent shadow-xl mb-1 text-[14px]"
                                        />
                                        <div className="flex justify-between">
                                            <span className="text-light text-[12px] dark:text-darkTextSecondary">Cooldown Period</span> <p className="font-medium">20d</p>
                                        </div>
                                    </div>
                                    <div className="flex lg:flex-col sxs3:flex-row sxs3:mt-5 lg:mt-0">
                                        <p className="font-medium">Claimable Dfinance</p>
                                        <div className="sxs3:ml-auto lg:m-0 sxs3:mb-2">
                                            <p className="font-medium">0 </p>
                                            <span className="font-light text-[10px] dark:text-darkTextSecondary">$0</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="grid grid-cols-2 items-center place-items-center mb-3 gap-3">
                                            <Button
                                                title={"Claim"}
                                                className="w-full bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-4 py-[10px] shadow-xl text-[14px]"
                                            />
                                            <Button
                                                title={"Restake"}
                                                className="w-full px-4 z-20  py-[10px] focus:outline-none shadow-xl box bg-transparent rounded-lg text-[14px]"
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-light text-[12px] dark:text-darkTextSecondary">Dfinance/month</span> <p className="font-medium">0</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* 2 */}
                    <div className="w-full min-h-[350px] p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative text-[#2A1F9D] dark:text-darkText mt-7">
                        <h2 className="font-bold text-[16px]">Stake Dfinance</h2>
                        <p className="text-[12px] dark:text-darkTextSecondary">Total Staked: 2.12 M ($213.59 M)</p>

                        <div className="flex flex-col gap-3">
                            <div className="border rounded-2xl mt-6 p-3">
                                <div className="flex justify-between align-center items-center">
                                    <div className="flex"><img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="mx-2 w-7 h-7" />
                                        <p className="font-bold text-[16px]">Dfinance</p>
                                    </div>
                                    <Button
                                        title={"Stake"}
                                        className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-6 py-[9px] shadow-2xl text-[14px]"
                                    />
                                </div>

                                <div className="w-full flex flex-wrap mt-3 whitespace-nowrap justify-between sxs3:flex-col lg:flex-row">
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">● Staking APR</h1>
                                        <p className="font-semibold text-[16px] ml-2">60%</p>
                                    </div>
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">
                                            ● Max Slashing
                                        </h1>

                                        <p className="font-semibold text-[16px] ml-2">40.00%</p>
                                    </div>
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">
                                            ● Wallet Balance
                                        </h1>

                                        <p className="font-semibold text-[16px] ml-2">0.00</p>
                                    </div>
                                </div>
                            </div>


                            <div className="border rounded-2xl mt-6 p-4">
                                <div className="grid lg:grid-cols-2 sxs3:grid-cols-1">
                                    <div className="flex lg:flex-col sxs3:flex-row">
                                        <p className="font-medium">Stake Dfinance</p>
                                        <div className="sxs3:ml-auto lg:m-0 sxs3:mb-2">
                                            <p className="font-medium">0 </p>
                                            <span className="font-light text-[10px]">$0</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 lg:mb-5">
                                        <Button
                                            title={"Cool down to stake"}
                                            className="w-full z-20 py-[13px] focus:outline-none box bg-transparent shadow-xl mb-1 text-[14px]"
                                        />
                                        <div className="flex justify-between">
                                            <span className="text-light text-[12px] dark:text-darkTextSecondary">Cooldown Period</span> <p className="font-medium">20d</p>
                                        </div>
                                    </div>
                                    <div className="flex lg:flex-col sxs3:flex-row sxs3:mt-5 lg:mt-0">
                                        <p className="font-medium">Claimable Dfinance</p>
                                        <div className="sxs3:ml-auto lg:m-0 sxs3:mb-2">
                                            <p className="font-medium">0 </p>
                                            <span className="font-light text-[10px] dark:text-darkTextSecondary">$0</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="grid grid-cols-2 items-center place-items-center mb-3 gap-3">
                                            <Button
                                                title={"Claim"}
                                                className="w-full bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-4 py-[10px] shadow-xl text-[14px]"
                                            />
                                            <Button
                                                title={"Restake"}
                                                className="w-full px-4 z-20  py-[10px] focus:outline-none shadow-xl box bg-transparent rounded-lg text-[14px]"
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-light text-[12px] dark:text-darkTextSecondary">Dfinance/month</span> <p className="font-medium">0</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>



                    {/* 3 */}
                    <div className="w-full min-h-[350px] p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative text-[#2A1F9D] dark:text-darkText mt-7">
                        <h2 className="font-bold text-[16px]">Stake Dfinance</h2>
                        <p className="text-[12px] dark:text-darkTextSecondary">Total Staked: 2.12 M ($213.59 M)</p>

                        <div className="flex flex-col gap-3">
                            <div className="border rounded-2xl mt-6 p-3">
                                <div className="flex justify-between align-center items-center">
                                    <div className="flex"><img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="mx-2 w-7 h-7" />
                                        <p className="font-bold text-[16px]">Dfinance</p>
                                    </div>
                                    <Button
                                        title={"Stake"}
                                        className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-6 py-[9px] shadow-2xl text-[14px]"
                                    />
                                </div>

                                <div className="w-full flex flex-wrap mt-3 whitespace-nowrap justify-between sxs3:flex-col lg:flex-row">
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">● Staking APR</h1>
                                        <p className="font-semibold text-[16px] ml-2">60%</p>
                                    </div>
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">
                                            ● Max Slashing
                                        </h1>

                                        <p className="font-semibold text-[16px] ml-2">40.00%</p>
                                    </div>
                                    <div className="relative text-[#5B62FE] p-3 flex-1  lg:grow-0 rounded-xl dark:text-darkText sxs3:flex sxs3:justify-between lg:block">
                                        <h1 className="text-[#2A1F9D] text-[12px] text-light dark:text-darkTextSecondary">
                                            ● Wallet Balance
                                        </h1>

                                        <p className="font-semibold text-[16px] ml-2">0.00</p>
                                    </div>
                                </div>
                            </div>


                            <div className="border rounded-2xl mt-6 p-4">
                                <div className="grid lg:grid-cols-2 sxs3:grid-cols-1">
                                    <div className="flex lg:flex-col sxs3:flex-row">
                                        <p className="font-medium">Stake Dfinance</p>
                                        <div className="sxs3:ml-auto lg:m-0 sxs3:mb-2">
                                            <p className="font-medium">0 </p>
                                            <span className="font-light text-[10px]">$0</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 lg:mb-5">
                                        <Button
                                            title={"Cool down to stake"}
                                            className="w-full z-20 py-[13px] focus:outline-none box bg-transparent shadow-xl mb-1 text-[14px]"
                                        />
                                        <div className="flex justify-between">
                                            <span className="text-light text-[12px] dark:text-darkTextSecondary">Cooldown Period</span> <p className="font-medium">20d</p>
                                        </div>
                                    </div>
                                    <div className="flex lg:flex-col sxs3:flex-row sxs3:mt-5 lg:mt-0">
                                        <p className="font-medium">Claimable Dfinance</p>
                                        <div className="sxs3:ml-auto lg:m-0 sxs3:mb-2">
                                            <p className="font-medium">0 </p>
                                            <span className="font-light text-[10px] dark:text-darkTextSecondary">$0</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="grid grid-cols-2 items-center place-items-center mb-3 gap-3">
                                            <Button
                                                title={"Claim"}
                                                className="w-full bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-4 py-[10px] shadow-xl text-[14px]"
                                            />
                                            <Button
                                                title={"Restake"}
                                                className="w-full px-4 z-20  py-[10px] focus:outline-none shadow-xl box bg-transparent rounded-lg text-[14px]"
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-light text-[12px] dark:text-darkTextSecondary">Dfinance/month</span> <p className="font-medium">0</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
};

export default StakesConnected;
