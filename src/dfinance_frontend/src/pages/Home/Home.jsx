import React from "react";
import { NavLink } from "react-router-dom";
import Ellipse from "../../components/Ellipse";
import Logo from "../../components/Logo";
import { FAQ_QUESTION, HOME_TOP_NAV_LINK, MAIN_NAV_LINK, SHOWCASE_SECTION } from "../../utils/constants";
import { Tab, Tabs } from "@mui/material";
import TabPanel from "../../components/Home/TabPanel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ShowCaseSection from "../../components/Home/ShowCaseSection";

const Home = () => {
    const [currentTab, setCurrentTab] = React.useState(0)
    const [currentFAQ, setCurrentFAQ] = React.useState(0)

    return (
        <>
            <div className="w-full flex justify-end absolute inset-0 -z-10">
                <Ellipse position={"top-right"} />
                <div className="absolute left-0 top-[145%]">
                    <Ellipse position={"middle-left"} />
                </div>
                <div className="absolute right-0 bottom-[-500%]">
                    <Ellipse position={"bottom-right"} />
                </div>
            </div>

            <div className="w-full px-24">
                <nav className="w-full py-10 mt-8 flex items-center justify-between">
                    <Logo />

                    <div className="flex gap-4">
                        {
                            HOME_TOP_NAV_LINK && HOME_TOP_NAV_LINK.map((link, index) =>
                                <NavLink key={index} to={link.route} className={`text-[#233D63] px-3`}>{link.title}</NavLink>
                            )
                        }
                    </div>

                    <button type="button" className="d_color border border-[#517688] p-2 text-sm rounded-full">Create Internet Identity</button>
                </nav>
                <div id="hero" className="flex justify-center text-[45px] font-extralight text-[#2A1F9D] mt-4">
                    <div className="w-[700px] flex flex-col items-center justify-center px-8">
                        <h1>ICP <span className="font-semibold bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] bg-clip-text text-transparent">DeFi</span> Earn And</h1>
                        <h1><span className="font-semibold bg-gradient-to-tr from-[#4659CF]/100 to-[#C562BD]/70 bg-clip-text text-transparent">Borrow</span> Across Network</h1>
                        <p className="text-sm font-normal text-[#737373] text-center mt-3">Contrary to popular belief, Lorem Ipsum is not simply random text.  45 BC text is It has roots in a piece of classical Latin literature from 45 BC.</p>


                        <div className="w-fit mt-8 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl text-center p-6">
                            <h1 className="text-[#2A1F9D] font-bold">$ 15,101,759,917.04M</h1>
                            <p className="text-sm font-normal text-[#737373]">of liquidity is locked in crypto across {8} networks and over {15} markets.</p>
                        </div>
                    </div>

                </div>

                {/* Tab based section */}
                <section className="mt-24">
                    <div className="w-full">
                        <nav className="flex justify-center not-italic">
                            <Tabs value={currentTab} onChange={(e, newTab) => setCurrentTab(newTab)} sx={{
                                "& .MuiTabs-indicator": {
                                    backgroundImage: 'linear-gradient(to right, rgb(70 89 207 / 1), #D379AB, rgb(197 98 189 / 0.7))'
                                }
                            }}>
                                {
                                    MAIN_NAV_LINK.map((item, index) =>
                                        <Tab key={index} label={item.title}
                                            disableRipple={true}
                                            disableFocusRipple={true}
                                            sx={{
                                                textTransform: "capitalize",
                                                fontStyle: "normal",
                                                fontWeight: "600",
                                                fontSize: "14px",
                                                color: "#2A1F9D",
                                                "&.Mui-selected": {
                                                    color: 'transparent',
                                                    backgroundImage: 'linear-gradient(to right, rgb(70 89 207 / 1), #D379AB, rgb(197 98 189 / 0.7))',
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }
                                            }} />)
                                }
                            </Tabs>
                        </nav>
                        <p className="text-sm font-normal text-[#737373] text-center mt-3">Supply into the protocol and watch your assets grow as a liquidity provider</p>
                    </div>
                    <div className="w-full mt-10">
                        <h1 className="text-[#0C5A74] font-semibold text-[36px] mb-2">Markets</h1>
                        <TabPanel currentTab={currentTab }/>
                        <div className="w-full flex justify-end mt-6">
                            <div id="pagination" className="flex gap-2">
                                <button type="button" className="border rounded-full p-1 border-[#517688] hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"><ChevronLeft /></button>
                                <button type="button" className="border rounded-full p-1 border-[#517688] hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"><ChevronRight /></button>
                            </div>
                        </div>
                    </div>
                    
                </section>



                {/* info section */}
                <section className="mt-24">
                    <div className="w-full flex justify-center">
                        <div className="w-3/4 p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl flex items-center text-white">
                            <div className="w-9/12">
                                <h1 className="font-semibold text-lg">And more to come...</h1>
                                <p className="mt-4 text-sm font-medium">Submit a proposal to deploy a new market in the Aave ecosystem. You can learn from the Aave governance.</p>
                            </div>
                            <div className="w-3/12 flex justify-center">
                                <button type="button" className="bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm">LEARN MORE</button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Governed by the Community */}
                <section className="mt-24">
                    <div className="w-full  text-center text-[#2A1F9D]">
                        <h1 className="text-[45px] font-extralight">Governed by the <span className="font-semibold">Community</span></h1>
                        <p className="text-[#737373]">Aave is a fully decentralized, community governed protocol with 166,579 token holders.</p>
                        <button type="button" className="bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm mt-5 text-white">LEARN MORE</button>
                    </div>
                    <div className="w-full flex justify-center my-3">
                        <div className="w-[700px] h-[400px]">
                            <img src="/image-78.svg" alt="Governed by the Community" className="w-full h-full object-contain"/>
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section className="mt-24">
                    <div className="w-full text-center text-[#2A1F9D]">
                        <h1 className="text-[45px] font-extralight">How it Works</h1>
                    </div>
                    <div className="w-full h-[400px] flex justify-center items-center flex-col relative cursor-pointer">
                        <div className="w-[700px] bg-[#DBE8EE] border-2 border-[#233D6324] my-3 top-0 rounded-3xl absolute translate-y-[0%] flex justify-center items-center p-4">

                            <div className="w-1/12 flex justify-center text-[64px] font-bold">
                                1
                            </div>
                            <div className="w-11/12 p-3">
                                <p className="font-semibold text-[#517687]">Submit ICP Request for comment(ARC)</p>
                                <p className="text-[#737373]">Discuss with community members and receive feedback.</p>
                            </div>
                        </div>
                        <div className="w-[800px] bg-[#DBE8EE] border-2 border-[#233D6324] my-3 top-0 rounded-3xl absolute translate-y-[75%] flex justify-center items-center p-4">

                            <div className="w-1/12 flex justify-center text-[64px] font-bold">
                                2
                            </div>
                            <div className="w-11/12 p-3">
                                <p className="font-semibold text-[#517687]">Create a snapshot</p>
                                <p className="text-[#737373]">Gauge community sentiment on a new proposal through a Snapshot.</p>
                            </div>
                        </div>
                        <div className="w-[900px] bg-[#DBE8EE] border-2 border-[#233D6324] my-3 top-0 rounded-3xl absolute translate-y-[145%] flex justify-center items-center p-4">

                            <div className="w-1/12 flex justify-center text-[64px] font-bold">
                                3
                            </div>
                            <div className="w-11/12 p-3">
                                <p className="font-semibold text-[#517687]">Submit an Aave Request for Improvement(AIP)</p>
                                <p className="text-[#737373]">The proposal is submitted through a GitHub pull request, & community votes on approvals.</p>
                            </div>
                        </div>
                    </div>
                    
                </section>

                {/* Showcase Section (ICP Grants DAO & Security Contributors) */}
                {
                    SHOWCASE_SECTION.map(item => <section className="mt-24">
                        <ShowCaseSection data={item}/>
                    </section>)
                }

                {/* FAQ */}
                <section className="mt-24">
                <div className="w-full p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl">
                    <div className="w-full">
                        <h1 className="text-[45px] font-extralight text-[#2A1F9D]">Frequently Asked Questions</h1>
                    </div> 
                    <div className="w-full flex">
                        <div className="w-6/12 relative flex items-center">
                            <div className="w-[115%] bg-white absolute shadow inset-auto rounded-xl overflow-hidden cursor-pointer">
                                {
                                        FAQ_QUESTION.map((item, index) => 
                                            <div key={index} className={`w-full flex p-4 items-center ${currentFAQ === index ? "bg-[#eef0f5]":"" } hover:bg-[#FAFBFF]`} onClick={() => setCurrentFAQ(index)}>
                                            <div className="w-1/12">
                                                    <div className={`w-4 h-4 rounded-full ${currentFAQ === index ? 'bg-[#517687]' : 
                                                    'bg-[#DBE8EE]'}`}></div>
                                            </div>
                                            <div className="w-10/12">{item.question}</div>
                                                <div className={`w-1/12 ${currentFAQ === index ? "text-[#517687]": "text-[#DBE8EE]"} flex justify-end`}>
                                                <ChevronRight/>
                                            </div>
                                        </div>)
                                }

                            </div>
                        </div>
                            <div className="w-6/12 h-[400px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6">
                                <h1 className="font-semibold mt-4">{FAQ_QUESTION.find(item => item.id === currentFAQ).question}</h1>
                                <p className="mt-8">{
                                    FAQ_QUESTION.find(item => item.id === currentFAQ).answer
                                }</p>
                            
                        </div>
                    </div>
                </div>
                </section>
            </div>
            {/* Footer */}
            <footer className="bg-[#233D63] mt-24 px-24 py-20">
                <div className="w-full flex">
                    <div className="w-3/12 text-white">
                        <img src="/DFinance.svg" alt="DFinance" />
                        <p className="mt-6">Block Sec focuses on the security of the
                            whole life cycle of smart contracts,
                            specializing in rigorous testing</p>
                    </div>
                    <div className="w-3/12 text-white px-24">
                        <h1 className="font-semibold">Useful Links</h1>
                        <div className="w-full flex flex-col mt-5">
                            {
                                HOME_TOP_NAV_LINK && HOME_TOP_NAV_LINK.map((link, index) =>
                                    <NavLink key={index} to={link.route} className={`pb-2`}>{link.title}</NavLink>
                                )
                            }
                        </div>
                    </div>
                    <div className="w-3/12 text-white px-24">
                        <h1 className="font-semibold">Community</h1>
                        <div className="w-full flex flex-col mt-5">
                            {
                                HOME_TOP_NAV_LINK && HOME_TOP_NAV_LINK.map((link, index) =>
                                    <NavLink key={index} to={link.route} className={`pb-2`}>{link.title}</NavLink>
                                )
                            }
                        </div>
                    </div>
                    <div className="w-3/12 text-white px-20">
                        <h1 className="font-semibold">Follow us on</h1>
                        <div className="flex gap-2 mt-6">
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/facebook.svg" alt="facebook" className="w-full h-full object-contain"/>
                            </span>
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/in.svg" alt="Linkedin" className="w-full h-full object-contain"/>
                            </span>
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/instagram.svg" alt="instagram" className="w-full h-full object-contain"/>
                            </span>
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/twitter.svg" alt="twitter" className="w-full h-full object-contain"/>
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Home;