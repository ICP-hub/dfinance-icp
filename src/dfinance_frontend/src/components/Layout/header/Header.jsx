import { MenuItems } from "./MenuItems"

export const Header = () => {

    let items = [
        {text: 'Dashboard', url : '#'},
        {text: 'Market', url : '#'},
        {text: 'Governance', url : '#'}
    ]
    return(
        <header>
            <div>
                <div>
                    {/* logo */}
                </div>

                
                    {/* list */}
                <MenuItems items={items}/>
                

                <div>
                    {/* button */}
                </div>
            </div>
        </header>
    )
}