import hre from 'hardhat';
import { getUserPermit } from '../helper/user-functions';

async function bridge(tokenContractAddress: string, bridgeContractAddress: string) {
    
	const localProvider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks.localhost.url);
    
    const [ , , user] = await hre.ethers.getSigners();
    
    const BridgeFactory = await hre.ethers.getContractFactory("Bridge"); 
    const bridgeContract = BridgeFactory.attach(bridgeContractAddress);
    
    const TokenFactory = await hre.ethers.getContractFactory("ERC20Token");
    const tokenContract = TokenFactory.attach(tokenContractAddress);
    
    await tokenContract.mint(user.address, 10);
    
    console.log('User address ', user.address);
    console.log('User balance ', (await tokenContract.balanceOf(user.address)).toString());
    console.log('Bridge contract balance after lock tx', (await tokenContract.balanceOf(bridgeContract.address)).toString());

    const signature = await getUserPermit(user.address, bridgeContract.address, tokenContract, localProvider, 10);

    console.log('Prepared the permit signature');
   
    console.log('Sending lock tx');
    await bridgeContract.connect(user).lock(1337, tokenContract.address, 10, signature.deadline, signature.v, signature.r, signature.s);
    console.log('Bridge contract balance after lock tx', (await tokenContract.balanceOf(bridgeContract.address)).toString());
    console.log('User balance ', (await tokenContract.balanceOf(user.address)).toString());
}


module.exports = bridge;