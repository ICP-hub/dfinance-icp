

export const FollowUsSection = ({socialMedia}) =>{
    console.log("Socials", socialMedia)
    return(
        <div class="flex flex-col">
            <h3 class="text-xl font-semibold mb-4">Follow us on</h3>
            <div class="flex space-x-4">
                {socialMedia.map((social,index)=>(
                    <>
                    <a key={index} href="https://www.linkedin.com/company/dfinanceprotocol/posts/?feedView=all" class="hover:text-gray-300 cursor-pointer" aria-label={socialMedia.name}>{social.icon}</a>
                    </>
                ))}
            </div>
        </div>
    )
}

