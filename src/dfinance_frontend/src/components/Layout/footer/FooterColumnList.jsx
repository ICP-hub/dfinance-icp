export const FooterColumnList = ({title, items}) => {
    return(
        <div>
            <h3 class="text-xl font-semibold mb-4">{title}</h3>
            <ul class="space-y-2">
                {
                    items.map((item, index) => (
                        <li key={index}>
                            <a href={item.href} class="hover:text-gray-300">{item.text}</a>
                        </li>
                    ))
                }
            </ul>
        </div>
    )
}

