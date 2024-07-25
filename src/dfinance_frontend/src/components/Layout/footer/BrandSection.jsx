export const BrandSection = (brandInfo) => {
    return(
        <div class="flex flex-col">
            <h2 class="text-2xl font-bold mb-3">{brandInfo.brand}</h2>
            <p class="text-gray text-sm">{brandInfo.des}</p>
        </div>
    )
}