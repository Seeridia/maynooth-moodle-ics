export interface Response {
  /** 事件列表 */
  events: Event[];
  /** 第一个事件ID */
  firstid: number;
  /** 最后一个事件ID */
  lastid: number;
  [property: string]: any;
}

export interface Event {
  /** 事件ID */
  id: number;
  /** 事件名称 */
  name: string;
  /** 事件描述 */
  description: string;
  /** 描述格式 */
  descriptionformat: number;
  /** 位置 */
  location: string;
  /** 类别ID */
  categoryid: null;
  /** 组ID */
  groupid: null;
  /** 用户ID */
  userid: number | null;
  /** 重复ID */
  repeatid: null;
  /** 事件计数 */
  eventcount: null;
  /** 组件 */
  component: string;
  /** 模块名称 */
  modulename: string;
  /** 活动名称 */
  activityname: string;
  /** 活动字符串 */
  activitystr: string;
  /** 实例 */
  instance: number;
  /** 事件类型 */
  eventtype: string;
  /** 开始时间 */
  timestart: number;
  /** 持续时间 */
  timeduration: number;
  /** 排序时间 */
  timesort: number;
  /** 用户午夜时间 */
  timeusermidnight: number;
  /** 是否可见 */
  visible: number;
  /** 修改时间 */
  timemodified: number;
  /** 是否过期 */
  overdue: boolean;
  /** 图标 */
  icon: Icon;
  /** 课程 */
  course: Course;
  /** 订阅 */
  subscription: Subscription;
  /** 是否可编辑 */
  canedit: boolean;
  /** 是否可删除 */
  candelete: boolean;
  /** 删除URL */
  deleteurl: string;
  /** 编辑URL */
  editurl: string;
  /** 查看URL */
  viewurl: string;
  /** 格式化时间 */
  formattedtime: string;
  /** 格式化位置 */
  formattedlocation: string;
  /** 是否为行动事件 */
  isactionevent: boolean;
  /** 是否为课程事件 */
  iscourseevent: boolean;
  /** 是否为类别事件 */
  iscategoryevent: boolean;
  /** 组名称 */
  groupname: null;
  /** 标准化事件类型 */
  normalisedeventtype: string;
  /** 标准化事件类型文本 */
  normalisedeventtypetext: string;
  /** 行动 */
  action: Action;
  /** 目的 */
  purpose: string;
  /** 是否品牌化 */
  branded: boolean;
  /** URL */
  url: string;
  [property: string]: any;
}

export interface Action {
  /** 名称 */
  name: string;
  /** URL */
  url: string;
  /** 项目计数 */
  itemcount: number;
  /** 是否可行动 */
  actionable: boolean;
  /** 是否显示项目计数 */
  showitemcount: boolean;
  [property: string]: any;
}

export interface Course {
  /** ID */
  id: number;
  /** 全名 */
  fullname: string;
  /** 简称 */
  shortname: string;
  /** ID编号 */
  idnumber: string;
  /** 摘要 */
  summary: string;
  /** 摘要格式 */
  summaryformat: number;
  /** 开始日期 */
  startdate: number;
  /** 结束日期 */
  enddate: number;
  /** 是否可见 */
  visible: boolean;
  /** 是否显示活动日期 */
  showactivitydates: boolean;
  /** 是否显示完成条件 */
  showcompletionconditions: boolean | null;
  /** PDF导出字体 */
  pdfexportfont: string;
  /** 全名显示 */
  fullnamedisplay: string;
  /** 查看URL */
  viewurl: string;
  /** 课程图像 */
  courseimage: string;
  /** 进度 */
  progress: number;
  /** 是否有进度 */
  hasprogress: boolean;
  /** 是否为收藏 */
  isfavourite: boolean;
  /** 是否隐藏 */
  hidden: boolean;
  /** 是否显示简称 */
  showshortname: boolean;
  /** 课程类别 */
  coursecategory: string;
  [property: string]: any;
}

export interface Icon {
  /** 键 */
  key: string;
  /** 组件 */
  component: string;
  /** 替代文本 */
  alttext: string;
  /** 图标URL */
  iconurl: string;
  /** 图标类 */
  iconclass: string;
  [property: string]: any;
}

export interface Subscription {
  /** 是否显示事件源 */
  displayeventsource: boolean;
  [property: string]: any;
}
