import { getFolderByUserAddress, getDataFromVault } from './getFolderdata'
import fs from 'fs'

console.log(import.meta.dirname)

async function main() {
    try {
        const data = await getFolderByUserAddress(
          "0xb4b291607e91da4654cab88e5e35ba2921ef68f1b43725ef2faeae045bf5915d"
        ); // input the user wallet address
        if (!data) return;
        console.log(data);
        if (typeof data != "string") {
          console.log(data);
          const dataList = data.map((item: any) => {
            if (!item.data.msg) {
              // @ts-ignore 
              return item.data.map((i) => i);
            } else {
              console.log("item", item);
            }
          });
          const result = dataList.filter((i) => i);

          // Write filtered data to file
          const formattedData = JSON.stringify(result, null, 2);
          fs.appendFileSync('packages/plugin-sui/src/data/data.ts', `\n${formattedData}`);
          console.log("New filtered data has been appended to data.ts");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
