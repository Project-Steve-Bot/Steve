# Steve
This version of Steve is a bot that I made for me and my friends. He is full of ridiculous, overcomplicated systems mostly originating from in-jokes and general shenanigans. The original version of Steve was not built by me and can be found [right here](https://github.com/stevebot-project/steve). This version is a 100% complete rewrite since the the framework OG Steve relies on ([Klasa](https://klasa.js.org/#/)) was discontinued and didn't receive updates when Discord decommissioned API v6 & v7. This new Steve is built using [Sapphire](https://www.sapphirejs.dev/) and even started from their TS example. 

### Shout outs
Shouts outs go to everyone, the creators of OG Steve, those who used to maintain Klasa, and those who do maintain Sapphire. Without any of those peeps, this Steve wouldn't exist for one reason or another.

###### And now, a picture of a koala.
![](https://cdn.discordapp.com/attachments/944669817137418333/950195568074977300/240px-Koala_climbing_tree.png)

## Running this bot yourself
Steve is programed in typescript and is desinged to be deployed in a docker container but he doesn't have to be. Truth be told, I do all the development outside a container and let github actions build and depoy the container to my cloud provider.

### Tools you'll need
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/) (Optional. Only needed if you want to build continers yourself)
- A package mananger (I use pnpm but you could use npm (which comes with node) or yarn or whatever you want)

### Running on your computer
#### Setup your environment
Sapphire, and by extension Steve, uses [dotenv-cra](https://www.npmjs.com/package/dotenv-cra) for environment variables. This means you can have multiple `.env` files and the correct one will be chosen based on your `NODE_ENV` environment vairable set by whatever tool your using to run the bot. The below instructions should:tm: work for your use case.

##### I dont care about using multiple  `.env` files
Okay, just fill in the empty `.env` file in the root of the project and you'll be set

##### I want to use multiple `.env` files
Cool, copy `.env` to files called `.env.development`, `.env.production`... and fill in the relevant info for each environment.

#### Build the code
Run `npm run build`

#### Run the code
You can use whatever you want to run the code (pm2, node a package manager) but for convience you can just run `npm run start` if you dont care about any thing fancy.

### Running on the cloud
There is a github action set up that builds the conainer and deploys it using a kubeconfig. Its setup to pull secretes from a github environment called `prod`. You should have the below secretes in that environment. They should be relativley stratightforward.
- DOCKERHUB_REPOSITORY
- DOCKERHUB_TOKEN
- DOCKERHUB_USERNAME
- KUBE_CONFIG
- PROCESS_ENV
And just like that your done. Whenvever you push a commit with a tag starting with `release`, it will build and deploy the code.
