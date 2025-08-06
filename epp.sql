create database requestsgava;

use requestsgava;

create table user (
  user_id int primary key auto_increment,
  name varchar(50) not null,
  last_name varchar(50) not null,
  email varchar(50) not null,
  password varchar(50) not null
);

create table user_type (
  user_type_id int primary key auto_increment,
  name varchar(50) not null
);

create table user_user_type (
  user_user_type_id int primary key auto_increment,
  user_id int not null,
  user_type_id int not null,
  foreign key (user_id) references user(user_id),
  foreign key (user_type_id) references user_type(user_type_id)
);

create table project (
  project_id int primary key auto_increment,
  name varchar(50) not null,
  description varchar(255) not null default 'Sin descripción',
  status varchar(20) check (status in ('active', 'inactive')) default 'active'
);

create table element (
  element_id int primary key auto_increment,
  name varchar(50) not null,
  description varchar(255) not null default 'Sin descripción'
);

create table request (
  request_id int primary key auto_increment,
  registration_date date not null,
  status varchar(20) check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  description varchar(255) not null, -- motivo general o resumen
  project_id int not null,
  user_id int not null,
  foreign key (project_id) references project(project_id),
  foreign key (user_id) references user(user_id)
);

create table element_request (
  element_request_id int primary key auto_increment,
  quantity_requested int not null,
  unit varchar(50) not null,
  element_id int not null,
  request_id int not null,
  foreign key (element_id) references element(element_id),
  foreign key (request_id) references request(request_id)
);

create table request_response (
  request_response_id int primary key auto_increment,
  request_id int not null,
  responder_user_id int not null,
  response_date date not null,
  status varchar(20) check (status in ('accepted', 'rejected')) not null,
  description varchar(255),
  foreign key (request_id) references request(request_id),
  foreign key (responder_user_id) references user(user_id)
);

create table element_request_response (
  element_request_response_id int primary key auto_increment,
  element_request_id int not null,
  request_response_id int not null,
  quantity_accepted int not null,
  foreign key (element_request_id) references element_request(element_request_id),
  foreign key (request_response_id) references request_response(request_response_id)
);
