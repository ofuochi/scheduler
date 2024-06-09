import React from 'react';
import { Menu } from 'antd';

const Navbar: React.FC = () => (
  <Menu mode="horizontal">
    <Menu.Item key="home">Task Manager</Menu.Item>
  </Menu>
);

export default Navbar;
