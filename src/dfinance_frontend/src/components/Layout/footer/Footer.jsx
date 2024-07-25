import { BrandSection } from "./BrandSection";
import { FooterColumnList } from "./FooterColumnList";
import { FollowUsSection } from "./FollowUsSection";
import { GrFacebookOption } from "react-icons/gr";
import { FaLinkedinIn } from "react-icons/fa6"
import { IoLogoInstagram } from "react-icons/io";
import { IoLogoTwitter } from "react-icons/io";

//Get icons

export const Footer = () => {

    let brandDescription = "Block Sec focuses on the security of the whole life cycle of smart contracts, specializing in rigorous testing";

    let usefulLinks = [
        { href: '#', text: 'Governance' },
        { href: '#', text: 'Security' },
        { href: '#', text: 'Documentation' },
        { href: '#', text: 'FAQ' }
    ];

    let community = [
        { href: '#', text: 'Help Center' },
        { href: '#', text: 'Partners' }, { href: '#', text: 'Suggestion' }, 
        { href: '#', text: 'Blog' }];

    let socials = [
        { name: 'Facebook', url: '#', icon: <GrFacebookOption />},
        { name: 'Linked', url: '#', icon: <FaLinkedinIn />},
        { name: 'Instagram', url: '#', icon: <IoLogoInstagram />},
        { name: 'Twitter', url: '#', icon: <IoLogoTwitter />}
    ];

    return (
        <footer class="py-8 text-white bg-blue-900 ">
            <div class="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mx-auto px-4 gap-8">

                {/* child divisions */}

                <BrandSection brand="Dfinance" des={brandDescription}></BrandSection>
                <FooterColumnList title="Useful Links" items={usefulLinks} />
                <FooterColumnList title="Community" items={community} />
                <FollowUsSection socialMedia={socials} />


            </div>
        </footer>
    )
}