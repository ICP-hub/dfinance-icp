import React from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../@/components/ui/table';

import Ellipse from '../../components/Ellipse';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';



const dummyData = [
    {
        asset: "Asset 1",
        totalSupplied: "100",
        supplyAPY: "5%",
        totalBorrowing: "50",
        borrowingAPY: "7%"
    },
    {
        asset: "Asset 2",
        totalSupplied: "200",
        supplyAPY: "4%",
        totalBorrowing: "75",
        borrowingAPY: "6%"
    },
    {
        asset: "Asset 3",
        totalSupplied: "150",
        supplyAPY: "6%",
        totalBorrowing: "100",
        borrowingAPY: "8%"
    },
    {
        asset: "Asset 4",
        totalSupplied: "300",
        supplyAPY: "3.5%",
        totalBorrowing: "80",
        borrowingAPY: "5.5%"
    },
    {
        asset: "Asset 5",
        totalSupplied: "250",
        supplyAPY: "5.5%",
        totalBorrowing: "120",
        borrowingAPY: "7.5%"
    },
    {
        asset: "Asset 6",
        totalSupplied: "180",
        supplyAPY: "4.5%",
        totalBorrowing: "90",
        borrowingAPY: "6.5%"
    },
    {
        asset: "Asset 7",
        totalSupplied: "220",
        supplyAPY: "4%",
        totalBorrowing: "110",
        borrowingAPY: "6.8%"
    },
    {
        asset: "Asset 8",
        totalSupplied: "280",
        supplyAPY: "3.8%",
        totalBorrowing: "130",
        borrowingAPY: "7.2%"
    },
    {
        asset: "Asset 9",
        totalSupplied: "320",
        supplyAPY: "3.2%",
        totalBorrowing: "140",
        borrowingAPY: "7.8%"
    },
    {
        asset: "Asset 10",
        totalSupplied: "350",
        supplyAPY: "3%",
        totalBorrowing: "150",
        borrowingAPY: "8%"
    }
];



function Market() {

    return (
        <div className="relative flex flex-col min-h-screen overflow-hidden">


            <div className="flex-grow overflow-hidden px-4 md:px-12 xl:px-24 relative  ">

                <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
                    <Ellipse position={"top-right"} className="w-96 h-96 md:w-[400px] md:h-[400px]" />
                </div> {/* This sets the position context for the absolutely positioned child */}
                <Navbar></Navbar>


                <div className="  flex items-center gap-20">
                    {/* Absolute positioning is relative to the nearest positioned parent, in this case, the div above with 'relative' */}

                    <div className="flex items-center">
                        <span className="font-poppins font-normal text-xl leading-8	 text-custom">arbitrum market</span>
                    </div>

                    <div className="flex items-center gap-4	 leading-6 text-base">
                        <div className="gradient-text">Total Market Size</div>
                        <div className="gradient-text">Total Available</div>
                        <div className="gradient-text">Total Borrows</div>
                    </div>
                </div>

                <div className="pt-10 mx-auto">
                    {/* The [value] here should be the combined height of the absolutely positioned content plus any desired additional space */}
                    <div className="gradient-text">Avalanche assets</div>

                    <div className='overflow-x-auto  pt-4'>

                        <Table className="min-w-full "
                        >
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0  z-10 font-poppins text-xs font-medium text-tableHeading pr-48">asset</TableHead>
                                    <TableHead className="font-poppins text-xs font-medium text-tableHeading pr-24">Total Supplied</TableHead>
                                    <TableHead className="font-poppins text-xs font-medium text-tableHeading pr-24">Supply APY</TableHead>
                                    <TableHead className="font-poppins text-xs font-medium text-tableHeading pr-24">Total Borrowing</TableHead>
                                    <TableHead className="font-poppins text-xs font-medium text-tableHeading pr-24">Borrowing APY, variable</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dummyData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="sticky left-0  z-10   font-poppins font-semibold text-custom flex items-center space-x-2 py-3 text-center align-middle" style={{ clipPath: 'inset(0,100%,0,0)' }}>
                                            <img src="/logo2.svg" alt="Logo" className="flex-shrink-0 h-6 w-6 " />
                                            <span className="whitespace-normal break-words text-center align-middle">{item.asset}</span>
                                        </TableCell>
                                        <TableCell className="font-poppins font-semibold text-custom pr-24  text-center align-middle">{item.totalSupplied}</TableCell>
                                        <TableCell className="font-poppins font-semibold text-custom pr-24  text-center align-middle">{item.supplyAPY}</TableCell>
                                        <TableCell className="font-poppins font-semibold text-custom pr-24  text-center align-middle">{item.totalBorrowing}</TableCell>
                                        <TableCell className="font-poppins font-semibold text-custom pr-24  text-center align-middle">{item.borrowingAPY}</TableCell>
                                        <TableCell className="font-poppins font-semibold text-custom pr-24  text-center align-middle">
                                            <button className='font-poppins gradient-button rounded px-5 text-white shadow-custom text-base w-24 h-6 text-center align-middle'
                                                onClick={(event) => { console.log(event.target.value) }}
                                                value={item.asset}
                                                style={{ textAlign: 'center' }}>
                                                Details
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                </div>



            </div>
            <div className="absolute left-0 bottom-0 xl:w-auto xl:h-auto -z-10 ">
                <Ellipse position={"bottom-left"} className="w-96 h-96 md:w-[600px] md:h-[600px]" />
            </div>

            <Footer></Footer>

        </div >
    )
}

export default Market
