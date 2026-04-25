export type BookmarkCategory =
  | "实时台风"
  | "卫星云图"
  | "雷达闪电"
  | "官方机构"
  | "数值预报"
  | "NMC天气图"
  | "论坛交流"
  | "学习资料"
  | "自定义";

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  category: BookmarkCategory;
  refresh: boolean;
  refreshIntervalMinutes?: number;
  pinned?: boolean;
};

export const categories: BookmarkCategory[] = [
  "实时台风",
  "卫星云图",
  "雷达闪电",
  "官方机构",
  "数值预报",
  "NMC天气图",
  "论坛交流",
  "学习资料",
  "自定义"
];

export const defaultBookmarks: Bookmark[] = [
  {
    id: "tieba-typhoon",
    title: "台风吧",
    url: "https://tieba.baidu.com/f?kw=%E5%8F%B0%E9%A3%8E&ie=utf-8",
    category: "论坛交流",
    refresh: false,
    pinned: true
  },
  {
    id: "tybbs",
    title: "台风论坛",
    url: "https://www.tybbs.org.cn/",
    category: "论坛交流",
    refresh: false,
    pinned: true
  },
  {
    id: "tyboard",
    title: "TY_Board 论坛",
    url: "https://www.tyboard.net/",
    category: "论坛交流",
    refresh: false
  },
  {
    id: "storm2k",
    title: "STORM2K",
    url: "https://www.storm2k.org/phpbb2/index.php",
    category: "论坛交流",
    refresh: false
  },
  {
    id: "tybbs-resources",
    title: "追击热带气旋常用网址资源",
    url: "https://www.tybbs.org.cn/forum.php?mod=viewthread&tid=80414",
    category: "论坛交流",
    refresh: false
  },
  {
    id: "jtwc",
    title: "JTWC",
    url: "https://www.metoc.navy.mil/jtwc/jtwc.html",
    category: "实时台风",
    refresh: true,
    pinned: true
  },
  {
    id: "rammb-tc",
    title: "RAMMB TC Real-Time",
    url: "https://rammb-data.cira.colostate.edu/tc_realtime/",
    category: "实时台风",
    refresh: true,
    pinned: true
  },
  {
    id: "tropical-tidbits",
    title: "Tropical Tidbits",
    url: "https://www.tropicaltidbits.com/",
    category: "实时台风",
    refresh: true,
    pinned: true
  },
  {
    id: "cyclonic-storms",
    title: "CyclonicWx Current Storms",
    url: "https://cyclonicwx.com/storms/",
    category: "实时台风",
    refresh: true
  },
  {
    id: "hurricanezone",
    title: "HurricaneZone 报文",
    url: "https://www.hurricanezone.org/",
    category: "实时台风",
    refresh: true
  },
  {
    id: "zczcnnnn",
    title: "ZCZCNNNN",
    url: "https://zczcnnnn.com/",
    category: "实时台风",
    refresh: true
  },
  {
    id: "fy4a",
    title: "风云四号卫星天气应用平台",
    url: "http://rsapp.nsmc.org.cn/geofy/?i=0&isPlay=true&speed=5&sat=fy-4a&pro=geos&type=reg_china&band=1&overlay=&x=250000&y=3300000&z=2&area=1&ll=0&county=1&duration=30&interval=1&c=false&cp=0.5&st=&et=&ac=&hide=1&s=1",
    category: "卫星云图",
    refresh: true,
    pinned: true
  },
  {
    id: "fy4a-test",
    title: "风云四号 test_geofy",
    url: "http://rsapp.nsmc.org.cn/test_geofy/?i=0&isPlay=true&speed=4&sat=fy-4a&pro=geos&type=reg_china&band=1&overlay=&x=250000&y=3300000&z=2.415037499278844&area=1&ll=0&county=0&textMarkup=1&duration=36&interval=1&c=false&cp=0.5&st=&et=&ac=&hide=1&s=1",
    category: "卫星云图",
    refresh: true
  },
  {
    id: "rammb-slider",
    title: "RAMMB/CIRA SLIDER",
    url: "https://rammb-slider.cira.colostate.edu/?sat=goes-16&sec=full_disk&x=10848&y=10848&z=0&angle=0&im=12&ts=1&st=0&et=0&speed=130&motion=loop&maps%5Bborders%5D=white&lat=0&p%5B0%5D=geocolor&opacity%5B0%5D=1&pause=0&slider=-1&hide_controls=0&mouse_draw=0&follow_feature=0&follow_hide=0&s=rammb-slider&draw_color=FFD700&draw_width=6",
    category: "卫星云图",
    refresh: true
  },
  {
    id: "himawari-target",
    title: "Himawari 机动观测域",
    url: "https://weather-models.info/latest/himawari-target.html",
    category: "卫星云图",
    refresh: true
  },
  {
    id: "nict-himawari",
    title: "NICT 向日葵-8 即时网页",
    url: "https://himawari8.nict.go.jp/zh/himawari8-image.htm",
    category: "卫星云图",
    refresh: true,
    pinned: true
  },
  {
    id: "digital-typhoon",
    title: "Digital Typhoon",
    url: "http://agora.ex.nii.ac.jp/digital-typhoon/",
    category: "卫星云图",
    refresh: true
  },
  {
    id: "cyclonic-sat",
    title: "CyclonicWx Satellite & Radar",
    url: "https://cyclonicwx.com/sat/",
    category: "卫星云图",
    refresh: true
  },
  {
    id: "weathernerds-sat",
    title: "Weathernerds Satellite Data",
    url: "https://www.weathernerds.org/satellite/?initsatsrc=On&initsatname=GOES-E&initsattype=ir&initcscheme=ir1&initimdimx=1050&initimdimy=630&initrange=55.000:-130.000:20.000:-60.000&initloop=False&initnframes=20&initlightningge=On&initlightninggw=Off&initltngfed=Off&initltngtoe=Off&initinterstates=On&initwarnings=On&initlatlon=Off&initascatb=Off&initascatc=Off&initascatambb=Off&initsst=Off&initecens=Off&initgefs=Off",
    category: "卫星云图",
    refresh: true
  },
  {
    id: "zoom-earth",
    title: "Zoom Earth",
    url: "https://zoom.earth/",
    category: "卫星云图",
    refresh: true,
    pinned: true
  },
  {
    id: "lightning",
    title: "三维闪电监测预警防御综合系统",
    url: "http://www.cnlightning.cn/CnlightningBuilder/index.html",
    category: "雷达闪电",
    refresh: true
  },
  {
    id: "haikou-radar",
    title: "海口一小时可降水量",
    url: "http://www.hkqx.net/LiveData/Radar/78",
    category: "雷达闪电",
    refresh: true
  },
  {
    id: "hainan-live",
    title: "海南省实况监测",
    url: "http://wx.hkqx.net/MobileWeatherHn/districtWeather.html",
    category: "雷达闪电",
    refresh: true
  },
  {
    id: "waterlog",
    title: "积水监看",
    url: "http://hkps.hkrxd.com:8080/m/jishuijiankan_list",
    category: "雷达闪电",
    refresh: true
  },
  {
    id: "hko-weather-chart",
    title: "香港天文台天气图",
    url: "https://www.hko.gov.hk/tc/wxinfo/currwx/wxcht.htm",
    category: "官方机构",
    refresh: true
  },
  {
    id: "nmc",
    title: "国家气象中心",
    url: "http://www.nmc.cn/",
    category: "官方机构",
    refresh: true,
    pinned: true
  },
  {
    id: "nmc-chart-h000",
    title: "NMC 地面天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h000.htm",
    category: "NMC天气图",
    refresh: true,
    pinned: true
  },
  {
    id: "nmc-chart-h925",
    title: "NMC 925hPa 天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h925.htm",
    category: "NMC天气图",
    refresh: true
  },
  {
    id: "nmc-chart-h850",
    title: "NMC 850hPa 天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h850.htm",
    category: "NMC天气图",
    refresh: true,
    pinned: true
  },
  {
    id: "nmc-chart-h700",
    title: "NMC 700hPa 天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h700.htm",
    category: "NMC天气图",
    refresh: true
  },
  {
    id: "nmc-chart-h500",
    title: "NMC 500hPa 天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h500.htm",
    category: "NMC天气图",
    refresh: true,
    pinned: true
  },
  {
    id: "nmc-chart-h200",
    title: "NMC 200hPa 天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h200.htm",
    category: "NMC天气图",
    refresh: true,
    pinned: true
  },
  {
    id: "nmc-chart-h100",
    title: "NMC 100hPa 天气图",
    url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h100.htm",
    category: "NMC天气图",
    refresh: true
  },
  {
    id: "nmc-satellite-h000",
    title: "NMC 地面叠加卫星云图",
    url: "http://www.nmc.cn/publish/observations/china/dm/radar-h000.htm",
    category: "NMC天气图",
    refresh: true
  },
  {
    id: "nmc-satellite-h850",
    title: "NMC 850hPa 叠加卫星云图",
    url: "http://www.nmc.cn/publish/observations/china/dm/radar-h850.htm",
    category: "NMC天气图",
    refresh: true
  },
  {
    id: "nmc-satellite-h500",
    title: "NMC 500hPa 叠加卫星云图",
    url: "http://www.nmc.cn/publish/observations/china/dm/radar-h500.htm",
    category: "NMC天气图",
    refresh: true
  },
  {
    id: "hainan-qx",
    title: "海南气象信息服务网",
    url: "http://www.hainanqx.cn/UI/Index/Index.aspx",
    category: "官方机构",
    refresh: true
  },
  {
    id: "hainan-cma",
    title: "海南气象局",
    url: "http://hi.cma.gov.cn/",
    category: "官方机构",
    refresh: true
  },
  {
    id: "wmc-bj",
    title: "WMC Beijing Global Early Warning",
    url: "http://ew4all.wmc-bj.net/EW4ALL/monitor",
    category: "官方机构",
    refresh: true
  },
  {
    id: "earth",
    title: "Earth Nullschool",
    url: "https://earth.nullschool.net/zh-cn/#2025/09/23/1700Z/wind/isobaric/850hPa/overlay=relative_humidity/grid=on/orthographic=-251.29,21.77,1887",
    category: "数值预报",
    refresh: true,
    pinned: true
  },
  {
    id: "ventusky",
    title: "Ventusky",
    url: "https://www.ventusky.com/?p=26.2;119.2;4&l=temperature-2m",
    category: "数值预报",
    refresh: true
  },
  {
    id: "meteologix",
    title: "Meteologix 中国",
    url: "https://meteologix.com/cn",
    category: "数值预报",
    refresh: true
  },
  {
    id: "zoom-pressure",
    title: "Zoom Earth 气压地图",
    url: "https://zoom.earth/maps/pressure/#view=22.52,114.72,5z/model=icon",
    category: "数值预报",
    refresh: true
  },
  {
    id: "cimss",
    title: "CIMSS Tropical Cyclones",
    url: "https://tropic.ssec.wisc.edu/",
    category: "数值预报",
    refresh: true
  },
  {
    id: "cimss-dlm",
    title: "CIMSS Layer Mean Wind 西太",
    url: "https://tropic.ssec.wisc.edu/real-time/dlmmain.php?&basin=westpac&sat=wgms&prod=dlm1&zoom=&time=",
    category: "数值预报",
    refresh: true
  },
  {
    id: "easterlywave",
    title: "Easterlywave",
    url: "https://www.easterlywave.com/",
    category: "数值预报",
    refresh: true
  },
  {
    id: "smca",
    title: "菜园子的天气栈",
    url: "https://www.smca.fun/",
    category: "数值预报",
    refresh: true
  },
  {
    id: "smca-ai",
    title: "菜园子 AI 台风集合预报",
    url: "https://www.smca.fun/nwp_TC_forecast_ai_FNV3_ensemble.html",
    category: "数值预报",
    refresh: true
  },
  {
    id: "weatherlab",
    title: "Weather Lab: Cyclones",
    url: "https://deepmind.google.com/science/weatherlab",
    category: "数值预报",
    refresh: true
  },
  {
    id: "tcfa",
    title: "气象环境遥感分析平台",
    url: "https://www.tcfa.top/",
    category: "数值预报",
    refresh: true
  },
  {
    id: "dvorak",
    title: "德沃夏克分析法教程",
    url: "https://www.tybbs.org.cn/forum.php?mod=viewthread&tid=75224",
    category: "学习资料",
    refresh: false
  },
  {
    id: "radar-course",
    title: "天气雷达探测与应用",
    url: "http://kejian2.cmatc.cma.cn/2020/tqradar/study_selftaught1.html",
    category: "学习资料",
    refresh: false
  },
  {
    id: "thunderstorm",
    title: "雷暴类型资料",
    url: "https://zhuanlan.zhihu.com/p/255253492",
    category: "学习资料",
    refresh: false
  },
  {
    id: "uwyo",
    title: "UWYO 探空资料",
    url: "http://weather.uwyo.edu/upperair/bufrraob.shtml",
    category: "学习资料",
    refresh: false
  },
  {
    id: "meteostat",
    title: "Meteostat 历史气候资料",
    url: "https://meteostat.net/en/station/57687?t=2026-04-06/2026-04-13",
    category: "学习资料",
    refresh: false
  }
];
