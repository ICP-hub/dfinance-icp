export const MenuItems = ({items}) =>{
    return(
        <div>
            <ul>
                {items.map((item, index)=>(
                    <li href={item.url}>{item.text}</li>
                ))}
            </ul>
        </div>
    )
}