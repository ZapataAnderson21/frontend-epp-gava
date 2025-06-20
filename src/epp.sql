create database requestsgava;

create table user(
  user_id int primary key,
  name varchar(50) not null,
  last_name varchar(50) not null,
  email varchar(50) not null,
  password varchar(50) not null
);

create table user_type(
  user_type_id int primary key,
  name varchar(50)
);

create table user_user_type(
  user_user_type_id int primary key,
  user_id int not null foreign key references user(user_id),
  user_type_id int not null foreign key references user_type(user_type_id)
);

create table project(
  project_id int primary key,
  name varchar(50) not null,
  description varchar(255) not null default 'Sin descripción',
  status (active, inactive) not null default 'active'
);

create table element(
  element_id int primary key,
  name varchar(50) not null,
  description varchar(255) not null default 'Sin descripción',
);

create table request(
  request_id int primary key,
  registration_date date not null,
  acceptance_date date null,
  status (pending, accepted, rejected) not null default 'pending',
  description varchar(255) not null,
  project_id int not null foreign key references project(project_id),
  user_id int not null foreign key references user(user_id),
);

create table request_rejected(
  request_rejected int primary key,
  rejection_date date not null,
  description varchar(50) null,
  request_id int not null foreign key references request(request_id)
);

create table request_accepted(
  request_accepted_id int primary key,
  acceptance_date date not null,
  description varchar(50) null,
  request_id int not null foreign key references request(request_id)
);

create table  element_request_accepted(
  element_request_accepted_id int primary key,
  quantity int not null,
  user_id int foreign key references user(user_id),
  element_id int foreign key references element(element_id),
  request_accepted_id int foreign key references request_accepted(request_accepted_id),
);

create table element_request(
  element_request_id int primary key,
  quantity int not null,
  unit varchar(50) not null,
  element_id int foreign key references element(element_id),
  request_id int foreign key references request(request_id),
)