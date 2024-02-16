import { mergeWith } from 'lodash';
const defaults = {
  "*": {
    links: [
      { text: 'Jenkins', url: 'http://10.5.50.54:8080/' },
    ]
  },
  "10.5.110.100": { // C1 DB01
    links: [
      { text: 'Graphs', url: 'http://10.5.110.134:3000/d/nginx/nginx-ingress-controller?orgId=1&from=now-30m&to=now&refresh=30s&var-namespace=All&var-controller_class=All&var-controller=All&var-ingress=All&var-Node=All&var-Namespace=All' },
      { text: 'Logs', url: 'http://10.5.110.136:9000/gettingstarted' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1629723754009&id=10714&myid=16297253111691720264&hide=-4,3,4,6,7,8,9,10,11,12,13,14,15,16' },
    ],
  },
  "10.5.110.101": { // C1 DB02
    links: [
      { text: 'Graphs', url: 'http://10.5.110.134:3000/d/nginx/nginx-ingress-controller?orgId=1&from=now-30m&to=now&refresh=30s&var-namespace=All&var-controller_class=All&var-controller=All&var-ingress=All&var-Node=All&var-Namespace=All' },
      { text: 'Logs', url: 'http://10.5.110.136:9000/gettingstarted' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1683635176351&id=9764&myid=16836368273243231275&hide=-4,3,5,6,7,8,9,10,11,12,13,14,15' },
    ],
  },
  "10.5.111.100": { // C2 DBO1
    links: [
      { text: 'Graphs', url: 'http://10.5.111.201:3000/d/nginx/nginx-ingress-controller-kub-c2-2023?orgId=1&refresh=30s' },
      { text: 'Logs', url: 'http://10.5.111.153:9000/search?q=&rangetype=relative&relative=300' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1629723754009&id=9360&myid=16297253111691720264&hide=-4,3,5,6,7,8,10,11,12,13,14,15,16' },
    ],
  },
  "10.5.111.101": { // C2 DBO2
    sshUser: 'snd_root',
    links: [
      { text: 'Graphs', url: 'http://10.5.111.201:3000/d/nginx/nginx-ingress-controller-kub-c2-2023?orgId=1&refresh=30s' },
      { text: 'Logs', url: 'http://10.5.111.153:9000/search?q=&rangetype=relative&relative=300' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1683635176439&id=10735&myid=16836371735043581025&hide=-4,3,5,6,7,8,9,10,11,12,13,14,15' },
    ],
  },
  "10.5.112.100": { // C3 DB01
    links: [
      { text: 'Graphs', url: 'http://10.5.112.175:3000/d/nginx/nginx-ingress-controller?orgId=1&refresh=30s' },
      { text: 'Logs', url: 'http://10.5.112.138:9000/' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1629729599713&id=9778&myid=16297296456972450894&hide=-4,3,5,6,7,8,9,10,11,12,13,14,15,16' },
    ],
  },
  "10.5.112.101": { // C3 DB02
    sshUser: 'snd_root',
    links: [
      { text: 'Graphs', url: 'http://10.5.112.175:3000/d/nginx/nginx-ingress-controller?orgId=1&refresh=30s' },
      { text: 'Logs', url: 'http://10.5.112.138:9000/' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1629729599713&id=9778&myid=16297296456972450894&hide=-4,3,5,6,7,8,9,10,11,12,13,14,15,16' },
    ],
  },
  "10.5.113.100": { // C4 DB01
    links: [
      { text: 'Graphs', url: 'http://10.5.113.177:3000/?orgId=1' },
      { text: 'Logs', url: 'http://10.5.113.123:9000/gettingstarted' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1636387985472&id=9936&myid=1636388128144929966&hide=-4,3,4,6,7,8,9,10,11,12,13,14,15' },
    ],
  },
  "10.5.113.101": { // C4 DB02
    links: [
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1683637261955&id=10596&myid=1683637323014130292&hide=-4,3,5,6,7,8,9,10,11,12,13,14,15,16' },
    ],
  },
  "10.5.114.100": { // C5 DB01
    sshUser: 'snd_root',
    links: [
      { text: 'Graphs', url: 'http://10.5.114.221:3000/d/nginx/nginx-ingress-controller-kub-c5-2023?orgId=1&refresh=30s' },
      { text: 'Logs', url: 'http://10.5.114.209:9000/search?q=&rangetype=relative&relative=300' },
    ],
  },
  mark: {
    cluster: 'Marknet', sshUser: 'snd_root', links: [
      { text: 'Graphs', url: 'http://10.5.101.226:3000/d/nginx/nginx-ingress-controller-marknet-as2-2023?orgId=1&refresh=30s' },
      { text: 'Logs', url: 'http://10.5.101.239:9000/search?q=&rangetype=relative&relative=300' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1683595857418&id=10736&myid=16835958840181888411&hide=-4,3,5,6,7,8,9,10,11,12,13,14,15' },
    ],
  },
  jmab: {
    cluster: 'JMA', links: [
      { text: 'Graphs', url: 'http://10.5.100.124:3000/d/nginx/nginx-ingress-controller-jma-as2-2022?orgId=1&refresh=30s' },
      { text: 'Logs', url: '#' },
      { text: 'DB CPU', url: 'https://10.0.30.208/chart.svg?type=graph&graphid=0&width=1400&height=900&username=ReadOnly&password=OnlyRead1&graphstyling=baseFontSize%3D%2710%27%20showLegend%3D%271%27&tooltexts=1&refreshable=true&columns=datetime%2Cvalue_%2Ccoverage&_=1636749213833&myid=02526904&hide=-4%2C3%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15&id=10866' },
    ],
  },
};

export function getOverrides(settings: any, client: any) {
  const merged = mergeWith(JSON.parse(JSON.stringify(settings)), defaults);

  const defaultOverrides = merged?.["*"];
  const dbOverrides = merged?.[client.db];
  const clientOverrides = merged?.[client.IMAGE_KEY || client.APP_NAME || client.WEBSITE_KEY];

  return mergeWith(clientOverrides, dbOverrides, defaultOverrides, (objValue, srcValue) => {
    if (!Array.isArray(objValue)) return undefined;
    return [...objValue, ...srcValue];
  });
}
