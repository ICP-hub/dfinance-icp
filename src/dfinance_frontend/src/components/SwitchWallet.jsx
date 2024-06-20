export default function SwitchWallet(){
    return(
        <>
          <div className="w-[300px] absolute top-full right-0 mt-3 rounded-md bg-gray-200 shadow-xl border p-4">
                      <h1 className="font-semibold">Switch Tokens</h1>

                      <div className="w-full my-2">
                        <input
                          type="text"
                          className="w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md"
                        />
                      </div>
                      <div className="w-full my-2">
                        <input
                          type="text"
                          className="w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md"
                        />
                      </div>
                      <div className="w-full flex justify-center mt-3">
                        <Button
                          title="Switch"
                          className={
                            "my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                          }
                        />
                      </div>
                    </div>
        </>
    )
}