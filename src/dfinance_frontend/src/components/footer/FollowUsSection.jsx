

export const FollowUsSection = ({socialMedia}) =>{
    return(
        <div class="flex flex-col">
            <h3 class="text-xl font-semibold mb-4">Follow us on</h3>
            <div class="flex space-x-4">
                {socialMedia.map((social,index)=>(
                    <>
                    <a key={index} href={social.url} class="hover:text-gray-300" aria-label={socialMedia.name}>{social.icon}</a>
                    </>
                ))}
            </div>
        </div>
    )
}










// export default function FollowUsSection({ socialMedia }) {
//     return (
//       <div className="flex flex-col"> {/* 1 */}
//         <h3 className="text-xl font-semibold mb-4">Follow us on</h3> {/* 2 */}
//         <div className="flex space-x-4"> {/* 3 */}
//           {socialMedia.map((media, index) => (
//             <a key={index} href={media.href} className="hover:text-gray-300" aria-label={media.name}> {/* 4 */}
//               {media.icon} {/* Replace with actual SVG or font icon */}
//             </a>
//           ))}
//         </div>
//       </div>
//     );
//   }



// export default function FooterColumn({ title, items }) {
//     return (
//       <div>
//         <h3 class="text-xl font-semibold mb-4">{title}</h3> {/* 1 */}
//         <ul class="space-y-2"> {/* 2 */}
//           {items.map((item, index) => (
//             <li key={index}>
//               <a href={item.href} class="hover:text-gray-300">{item.text}</a> {/* 3 */}
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   }
  